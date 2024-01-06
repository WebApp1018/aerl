use crate::modbus::{interface::Interface, product::Product};

/// Modbus product table row
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ModbusProduct {
    pub id: u64,
    pub created_at: String,
    pub schema: Product,
}

/// Modbus interface configuration table row
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ModbusInterface {
    pub id: u64,
    pub created_at: String,
    pub device_id: u64,
    pub config: Interface,
}

/// Modbus device table row
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ModbusDevice {
    pub id: u64,
    pub created_at: String,
    pub interface_id: u64,
    pub product_id: u64,
    pub slave_id: u16,
}
