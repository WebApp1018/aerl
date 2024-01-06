use std::io::Result;

fn main() -> Result<()> {
    prost_build::compile_protos(&["src/canbus.proto", "src/modbus.proto"], &["src"])?;

    Ok(())
}
