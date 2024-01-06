use anyhow::{Context, Result};
use can_dbc::DBC;

use crate::supabase;

/// Matcher function. Returns true if the message should be processed.
type Matcher = fn(u32) -> bool;

/// Instance of a device matcher and DBC schema.
#[derive(Debug, Clone)]
pub struct Device {
    pub dbc: DBC,
    pub matcher: Matcher,
}

lazy_static::lazy_static! {
    static ref SRX: Device = Device {
        dbc: can_dbc::DBC::from_slice(include_str!("../dbc/srx.dbc").as_bytes()).unwrap(),
        matcher: |id| {
            let device = Identifier::from_raw(id).device;

            device >= 10 && device <= 51
        },
    };
    static ref EG: Device = Device {
        dbc: can_dbc::DBC::from_slice(include_str!("../dbc/earthguard.dbc").as_bytes()).unwrap(),
        matcher: |id| {
            let device = Identifier::from_raw(id).device;
            device >= 52 && device <= 55
        },
    };
    pub static ref DEVICES: Vec<Device> = vec![
        SRX.to_owned(),
        EG.to_owned(),
    ];
}

/// Standard AERL Idenfitier Structure.
pub struct Identifier {
    pub message: u8,
    pub device: u8,
}

impl Identifier {
    /// Convert 11-bit identifier into components.
    pub fn from_raw(id: u32) -> Identifier {
        Identifier {
            message: (id & 0b11111) as u8,
            device: ((id >> 5) & 0b111111) as u8,
        }
    }
}

pub async fn task() -> Result<()> {
    loop {
        supabase::refresh_devices()
            .await
            .context("Failed to refresh device list")?;

        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identifier_empty() {
        let id = Identifier::from_raw(0);

        assert_eq!(id.device, 0);
        assert_eq!(id.message, 0);
    }

    #[test]
    fn test_identifier_example() {
        let id = Identifier::from_raw(0x144);

        assert_eq!(id.device, 10);
        assert_eq!(id.message, 4);
    }

    #[test]
    fn test_srx_matcher() {
        assert!((SRX.matcher)(0x140));
        assert!((SRX.matcher)(0x142));
        assert!((SRX.matcher)(0x145));
        assert!((SRX.matcher)(0x161));
        assert!((SRX.matcher)(0x164));
    }

    #[test]
    fn test_earthguard_matcher() {
        assert!((EG.matcher)(0x680));
        assert!((EG.matcher)(0x6E0));
        assert!((EG.matcher)(0x6E5));
    }
}
