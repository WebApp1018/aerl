pub mod identifier;

use crate::auth::ACCESS_TOKEN;
use crate::ARGS;
use anyhow::{Context, Result};
use prost::Message;
use reqwest::Client;
use socketcan::Frame as _;
use socketcan::{CanSocket, EmbeddedFrame, Id, Socket};
use std::{
    collections::HashMap,
    process::Command,
    time::{Duration, SystemTime},
};
use tokio::{sync::Mutex, task::JoinHandle};

include!(concat!(env!("OUT_DIR"), "/canbus.rs"));

lazy_static::lazy_static! {
    static ref QUEUE: Mutex<Vec<Frame>> = Mutex::new(Vec::new());
}

/// Returns a list of CAN bus interface names
pub fn interfaces() -> Vec<String> {
    pnet_datalink::interfaces()
        .into_iter()
        .filter(|i| i.name.starts_with("can") || i.name.starts_with("vcan"))
        .map(|i| i.name)
        .collect()
}

/// Configures given a CAN bus interface
pub fn configure(interface: &String) -> std::io::Result<()> {
    Command::new("sudo")
        .args(["modprobe", "can"])
        .spawn()?
        .wait()?;

    Command::new("sudo")
        .args(["modprobe", "can_raw"])
        .spawn()?
        .wait()?;

    Command::new("sudo")
        .args(["ip", "link", "set", interface, "down"])
        .spawn()?
        .wait()?;

    Command::new("sudo")
        .args([
            "ip", "link", "set", interface, "type", "can", "bitrate", "500000",
        ])
        .spawn()?
        .wait()?;

    Command::new("sudo")
        .args(["ip", "link", "set", interface, "up"])
        .spawn()?
        .wait()?;

    Ok(())
}

pub async fn push_frames(frames: Vec<Frame>) -> Result<()> {
    let payload = Payload { frames };

    let body = payload.encode_to_vec();

    let req = Client::new()
        .post(format!("{}/stream/canbus/push", &ARGS.api_url))
        .header(
            "Authorization",
            format!("Bearer {}", &ACCESS_TOKEN.read().await),
        )
        .body(body);

    let res = req.send().await.context("Failed to push frame")?;

    match res.error_for_status() {
        Ok(_) => Ok(()),
        Err(e) => Err(e.into()),
    }
}

/// CAN bus event loop task
pub async fn task() -> Result<()> {
    // interface name, thread handle
    let mut can_threads: HashMap<String, JoinHandle<()>> = HashMap::new();

    tokio::spawn(async move {
        loop {
            let mut q = QUEUE.lock().await;

            // any pending items
            if !q.is_empty() {
                if let Err(e) = push_frames(q.clone()).await {
                    log::error!("{e}");
                } else {
                    log::info!("Pushed {} CAN frames", q.len());
                }

                q.clear();
            } else {
                log::info!("No CAN bus frames to send.");
            }

            drop(q);

            tokio::time::sleep(Duration::from_secs(30)).await;
        }
    });

    loop {
        log::info!("Cleaning up CAN Bus handlers");
        // remove threads that have ended
        can_threads.retain(|_, t| !t.is_finished());

        // get interfaces
        let interfaces = interfaces();
        log::info!("Found {} CAN Bus interfaces", interfaces.len());

        // create threads for each interface
        for interface in interfaces {
            // skip second interface for now
            if interface == "can1" {
                continue;
            }

            if !can_threads.contains_key(&interface) {
                log::info!("Opening interface: {interface}");

                if let Err(e) = configure(&interface) {
                    log::error!("Failed to configure interface {interface} with error {e}");
                    continue;
                }

                let can = match CanSocket::open(&interface) {
                    Ok(socket) => socket,
                    Err(e) => {
                        log::error!("Could not open socket: {e}");
                        continue;
                    }
                };

                let interface_name = interface.clone();

                let handle = tokio::spawn(async move {
                    loop {
                        // read a frame
                        let frame = match can.read_frame() {
                            Ok(frame) => frame,
                            Err(e) => {
                                log::error!("Failed to read frame: {}", e);
                                continue;
                            }
                        };

                        log::info!("Got frame with id: {:#x}", frame.id_word());

                        let mut q = QUEUE.lock().await;

                        let id = match frame.id() {
                            Id::Standard(s) => s.as_raw() as u32,
                            Id::Extended(e) => e.as_raw(),
                        };

                        q.push(Frame {
                            time: Some(SystemTime::now().into()),
                            interface: interface.clone(),
                            id,
                            extended: frame.is_extended(),
                            error: frame.is_error_frame(),
                            rtr: frame.is_remote_frame(),
                            data: frame.data().into(),
                        });
                    }
                });

                can_threads.insert(interface_name, handle);
            }
        }

        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}
