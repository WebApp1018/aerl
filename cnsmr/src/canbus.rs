include!(concat!(env!("OUT_DIR"), "/canbus.rs"));

use crate::{
    devices::{Identifier, DEVICES as KNOWN_DEVICES},
    prometheus::{self, Label, Sample, TimeSeries},
    serial_store::SerialNumberStore,
    supabase::DEVICES,
    ARGS,
};
use anyhow::Result;
use async_nats::jetstream::{consumer, AckKind};
use futures::TryStreamExt;
use metrics::increment_counter;
use prost::Message;
use std::{collections::HashMap, time::Duration};
use tokio::sync::RwLock;

lazy_static::lazy_static! {
    static ref SERIAL_STORE: RwLock<SerialNumberStore> = RwLock::new(SerialNumberStore::new());
}

pub async fn from_frame(
    frame: &Frame,
    org_id: &str,
    machine_id: &str,
    hub_id: &str,
) -> Result<Vec<TimeSeries>> {
    let mut timeseries: Vec<TimeSeries> = Vec::new();

    // get timestamp from source data
    let t = frame.time.as_ref().unwrap();
    let seconds = Duration::from_secs(t.seconds as u64);
    let nanos = Duration::from_nanos(t.nanos as u64);
    let time = (seconds + nanos).as_millis() as i64;

    if let Some(device) = KNOWN_DEVICES.iter().find(|d| (d.matcher)(frame.id)) {
        let dbc = &device.dbc;

        // get message id
        let id = Identifier::from_raw(frame.id);

        // convert byte array into u64
        let data = &frame
            .data
            .clone()
            .into_iter()
            .take(8)
            .fold(0, |acc, byte| (acc << 8) | u64::from(byte));

        for msg in dbc.messages() {
            if msg.message_id().0 == id.message as u32 {
                for sig in msg.signals() {
                    let mask = (1 << sig.signal_size()) - 1; // mask
                    let value = ((data >> sig.start_bit()) & mask) as i32; // extract
                    let value = sig.factor() * value as f64; // scale
                    let value = sig.offset() + value; // offset

                    let interface = frame.interface.as_str();

                    let mut labels: Vec<Label> = vec![
                        Label {
                            name: "__name__".to_string(),
                            value: format!("{}_{}", msg.message_name(), sig.name()),
                        },
                        Label {
                            name: "canbus_device".to_string(),
                            value: id.device.to_string(),
                        },
                        Label {
                            name: "org".to_string(),
                            value: org_id.to_string(),
                        },
                        Label {
                            name: "machine".to_string(),
                            value: machine_id.to_string(),
                        },
                        Label {
                            name: "hub".to_string(),
                            value: hub_id.to_string(),
                        },
                        Label {
                            name: "interface".to_string(),
                            value: format!("canbus,{}", &frame.interface),
                        },
                    ];

                    let serial_number_key = &[
                        org_id,
                        machine_id,
                        hub_id,
                        interface,
                        &id.device.to_string(),
                    ];

                    if sig.name() == "serial_number" && id.message == 0 {
                        SERIAL_STORE
                            .write()
                            .await
                            .append(serial_number_key, value.to_string());
                    }

                    // read serial
                    if let Some(serial) = SERIAL_STORE.read().await.get(serial_number_key) {
                        labels.push(Label {
                            name: "serial_number".to_string(),
                            value: serial,
                        })
                    }

                    timeseries.push(TimeSeries {
                        labels,
                        samples: vec![Sample {
                            value: value.clone(),
                            timestamp: time,
                        }],
                        exemplars: vec![],
                    });
                }
            }
        }
    } else {
        return Ok(Vec::new());
    }

    Ok(timeseries)
}

pub async fn task() -> Result<()> {
    let nats = async_nats::connect(&ARGS.nats_url).await?;
    let js = async_nats::jetstream::new(nats);

    let stream = js.get_stream("telemetry_ingest").await?;
    let consumer: consumer::PullConsumer = stream.get_consumer("cnsmr_canbus").await.unwrap();

    loop {
        log::info!("Processing...");

        let mut messages = consumer.batch().max_messages(1000).messages().await?;

        let mut streams = HashMap::<String, Vec<TimeSeries>>::new();

        while let Ok(Some(message)) = messages.try_next().await {
            increment_counter!("cnsmr_ingest_canbus_frames_total");

            // subject is of the form `ingest.canbus.<machine-id>`
            let subject_path: Vec<&str> = message.subject.split(".").collect();
            let machine_id = subject_path[2];

            let device = &DEVICES
                .read()
                .await
                .clone()
                .into_iter()
                .find(|d| d.hub.machine_id == machine_id);

            let org_id = match device {
                Some(d) => d.org.id.to_string(),
                None => "unknown".to_string(),
            };

            let hub_id = match device {
                Some(d) => d.hub.id.to_string(),
                None => "unknown".to_string(),
            };

            let mut frame = Frame::default();

            match frame.merge(message.payload.clone()) {
                Ok(_) => {}
                Err(e) => {
                    log::error!("Got deserialisation error: {e}");
                    let _ = message.ack_with(AckKind::Ack).await;
                    increment_counter!("cnsmr_ingest_canbus_frames_failed");
                    continue;
                }
            };

            let mut series = match from_frame(&frame, &org_id, &machine_id, &hub_id).await {
                Ok(s) => s,
                Err(e) => {
                    log::error!("Failed to deserialize frame: {e:?}");
                    let _ = message.ack_with(AckKind::Ack).await;
                    continue;
                }
            };

            let org_key = match device {
                Some(d) => d.key.to_string(),
                None => "anonymous".to_string(),
            };

            if let Some(stream) = streams.get_mut(&org_key) {
                stream.append(&mut series);
            } else {
                streams.insert(org_key, series);
            }

            let _ = message.ack().await;
        }

        for (org_key, stream) in streams {
            match prometheus::push(&ARGS.mimir_url, &org_key, stream).await {
                Ok(_) => {}
                Err(e) => log::error!("Failed to push to Mimir: {e}"),
            }
        }
    }
}
