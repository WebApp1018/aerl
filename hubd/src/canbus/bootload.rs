use crate::canbus::{self, identifier::AerlIdentifier};
use crate::ARGS;
use anyhow::Result;
use socketcan::EmbeddedFrame as _;
use socketcan::Frame as _;
use socketcan::{BlockingCan, CanDataFrame, CanFrame, CanSocket, Socket, StandardId};
use std::thread;

const FIRMWARE_BINARY: &[u8] = include_bytes!("v1.9.2.bin");

/// Protection key used to unlock the bootloader.
/// Not particularly secret since it's sent in the clear clear over the wire.
const PROTECTION_KEY: &[u8] = &[0xEF, 0x73, 0xBD, 0xA3];

/// CAN bus command message identifiers
enum CommandMessage {
    /// Shutdown charger output.
    Shutdown = 24,
    /// Enter into the bootloader.
    Begin = 26,
    /// Upload 4 bytes of data to a given address.
    Upload = 27,
    /// Finish loading.
    End = 28,
    /// Erase firmware.
    Erase = 29,
}

/// CAN bus response message identifiers
enum ResponseMessage {
    /// Ack
    Ack = 6,
}

pub async fn load(socket: &mut CanSocket, serial_number: &str) -> Result<()> {
    let serial_number: u32 = serial_number.parse()?;

    shutdown(socket);

    begin(socket, serial_number)?;

    upload(socket, FIRMWARE_BINARY)?;

    end(socket)?;

    Ok(())
}

pub fn shutdown(socket: &mut CanSocket) -> Result<()> {
    let id = AerlIdentifier {
        message: CommandMessage::Shutdown as u8,
        device: 0,
    };

    let frame = CanFrame::new(StandardId::new(id.into()).unwrap(), &[]).unwrap();

    socket.transmit(&frame)?;

    Ok(())
}

pub fn begin(socket: &mut CanSocket, serial_number: u32) -> Result<()> {
    let id = AerlIdentifier {
        message: CommandMessage::Begin as u8,
        device: 0,
    };

    let mut data = Vec::new();
    data.extend_from_slice(PROTECTION_KEY);
    data.extend_from_slice(&serial_number.to_le_bytes());

    let frame = CanFrame::new(StandardId::new(id.into()).unwrap(), &data).unwrap();

    socket.transmit(&frame)?;

    Ok(())
}

pub fn upload(socket: &mut CanSocket, binary: &[u8]) -> Result<()> {
    let mut index: usize = 0;
    let length = binary.len(); // index by word

    while index < length {
        let id = AerlIdentifier {
            message: CommandMessage::Upload as u8,
            device: 0,
        };

        let mut data: Vec<u8> = Vec::new();
        data.extend((index as u32).to_le_bytes());
        data.push(binary[index + 0]);
        data.push(binary[index + 1]);
        data.push(binary[index + 2]);
        data.push(binary[index + 3]);

        let frame = CanFrame::new(StandardId::new(id.into()).unwrap(), &data).unwrap();

        socket.transmit(&frame)?;

        log::info!("Sent frame to device");

        let mut acked = false;
        while !acked {
            let frame = socket.receive()?;

            match frame.id() {
                socketcan::Id::Standard(id) => {
                    let id = AerlIdentifier::from(id.as_raw());

                    if id.message == ResponseMessage::Ack as u8 {
                        log::info!("Got ack.");
                        acked = true;
                    }
                }
                _ => {}
            }
        }

        index += 4;
    }

    log::info!("Finished uploading firmware.");

    Ok(())
}

pub fn end(socket: &mut CanSocket) -> Result<()> {
    let id = AerlIdentifier {
        message: CommandMessage::End as u8,
        device: 0,
    };

    let frame = CanFrame::new(StandardId::new(id.into()).unwrap(), &[]).unwrap();

    socket.transmit(&frame)?;

    Ok(())
}
