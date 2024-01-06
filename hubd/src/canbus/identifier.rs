use std::convert::{From, Into};

#[derive(Clone, Copy)]
/// AERL CAN Bus Identifier
pub struct AerlIdentifier {
    pub message: u8,
    pub device: u8,
}

impl From<u16> for AerlIdentifier {
    /// Decode identifier from 11-bit identifier.
    fn from(value: u16) -> Self {
        AerlIdentifier {
            message: (value & 0b11111) as u8,
            device: ((value >> 5) & 0b111111) as u8,
        }
    }
}

impl Into<u16> for AerlIdentifier {
    /// Decode identifier from 11-bit identifier.
    fn into(self) -> u16 {
        let message = (self.message as u16) & 0b11111;
        let device = ((self.device as u16) & 0b111111) << 5;

        message | device
    }
}
