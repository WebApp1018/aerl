include!(concat!(env!("OUT_DIR"), "/modbus.rs"));

use axum::body::Bytes;
use axum::http::StatusCode;
use axum_macros::debug_handler;
use prost::Message;

/// Modbus frame push handler
#[debug_handler]
pub async fn stream_push(body: Bytes) -> Result<String, StatusCode> {
    match Payload::decode(body) {
        Ok(payload) => {
            let frames: Vec<Frame> = payload.frames;

            if frames.len() == 0 {
                log::info!("No frames provided.");
                return Err(StatusCode::OK);
            }

            // todo: add data frames to NATS stream.
            Err(StatusCode::NOT_IMPLEMENTED)
        }
        Err(e) => {
            log::error!("{}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
