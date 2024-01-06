use anyhow::{Context, Ok, Result};
use std::env;
use std::path::Path;
use std::process::Command;

fn main() -> Result<()> {
    println!("Running build.rs...");
    // Compile protobuf compiler from source.
    // This fixes some cross-compilation issues.
    std::env::set_var("PROTOC", protobuf_src::protoc());

    prost_build::compile_protos(
        &["src/canbus/canbus.proto", "src/modbus/modbus.proto"],
        &["src/"],
    )?;

    // Compile the webui
    // We only do this in non-realease builds for dev convenience.
    // For releases we use the pipeline which has an explicit build step for the react project
    if env::var("PROFILE").unwrap() != "release" {
        let react_project_path = "web/";

        let current_dir = env::current_dir().unwrap();
        let react_path = Path::new(&current_dir).join(react_project_path);

        let install_status = Command::new("pnpm")
            .args(&["install"])
            .current_dir(&react_path)
            .status()?;

        println!(
            "ERROR: `pnpm install` exited with status {}",
            install_status
        );
        assert!(install_status.success()); // To print debug info, the build file must panic.

        let build_status = Command::new("pnpm")
            .args(&["build"])
            .current_dir(&react_path)
            .status()
            .context("pnpm build failed")?;

        println!("ERROR: `pnpm build` exited with status {}", build_status);
        assert!(build_status.success()); // To print debug info, the build file must panic.
    }

    Ok(())
}
