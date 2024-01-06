pub mod device;
pub mod interface;
pub mod product;

use self::device::{build_context, read_register};
use self::interface::{Interface, Tcp};
use self::product::Product;

include!(concat!(env!("OUT_DIR"), "/modbus.rs"));
