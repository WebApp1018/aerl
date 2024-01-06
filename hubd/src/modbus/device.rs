use super::{interface::Interface, product::Register};
use anyhow::{anyhow, Result};
use tokio_modbus::{
    client::{rtu, tcp, Context},
    Slave,
};

/// Build a connection context from an interface.
pub async fn build_context(interface: &Interface, slave: Slave) -> Result<Context> {
    Ok(match interface {
        Interface::Tcp(i) => {
            let addr = std::net::SocketAddr::new(i.address.into(), i.port.get());
            tcp::connect_slave(addr, slave).await?
        }
        Interface::Rtu(i) => {
            let builder = tokio_serial::new(&i.path, i.baud_rate as u32);
            let port = tokio_serial::SerialStream::open(&builder)?;
            rtu::attach_slave(port, slave)
        }
    })
}

/// Read a single value from a given register address with the provided connection context.
pub async fn read_register(ctx: &mut Context, register: &Register) -> Result<u32> {
    use tokio_modbus::prelude::*;

    let address = register.address as u16;
    let result: Vec<u32> =
        match address {
            00000..=09999 => match ctx.read_coils(address, 1).await {
                Ok(v) => v.into_iter().map(|x| x as u32).collect(),
                Err(e) => {
                    return Err(anyhow!("Failed to read coil register {}: {}", address, e));
                }
            },
            10000..=19999 => match ctx.read_discrete_inputs(address - 10001, 1).await {
                Ok(v) => v.into_iter().map(|x| x as u32).collect(),
                Err(e) => {
                    return Err(
                        anyhow!("Failed to read discrete input register {}: {}", address, e)
                    );
                }
            },
            30000..=39999 => match ctx.read_input_registers(address - 30000, 1).await {
                Ok(v) => v.into_iter().map(|x| x as u32).collect(),
                Err(e) => {
                    return Err(anyhow!("Failed to read input register {}: {}", address, e));
                }
            },
            40000..=49999 => match ctx.read_holding_registers(address - 40000, 1).await {
                Ok(v) => v.into_iter().map(|x| x as u32).collect(),
                Err(e) => {
                    return Err(anyhow!("Failed to read holding register {}: {}", address, e));
                }
            },
            _ => {
                return Err(anyhow!("Register {} not handled.", address));
            }
        };

    match result.first() {
        Some(v) => Ok(v.to_owned()),
        None => Err(anyhow!("No data returned from register")),
    }
}
