mod args;
mod canbus;
mod devices;
mod metrics;
mod prometheus;
mod serial_store;
mod supabase;

use anyhow::Result;
use args::Args;
use clap::Parser;
use log::LevelFilter;
use supabase::DEVICES;
use tokio::select;

lazy_static::lazy_static! {
    static ref ARGS: Args = Args::parse();
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::new()
        // set our log filter from settings
        .filter(None, LevelFilter::Info)
        .init();

    metrics::metrics();

    log::info!("Reading in initial devices.");

    // block until devices have been loaded
    loop {
        supabase::refresh_devices().await.unwrap();

        let devices = DEVICES.read().await;

        if devices.len() != 0 {
            break;
        }
    }

    log::info!("Starting service tasks.");

    select! {
        e = metrics::task() => log::error!("Metrics server task has stopped: {e:?}"),
        e = devices::task() => log::error!("Device refresh task stopped: {e:?}"),
        e = canbus::task() => log::error!("CAN Bus task stopped: {e:?}"),
    };

    Err(anyhow::anyhow!("Process exited."))
}
