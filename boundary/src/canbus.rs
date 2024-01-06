include!(concat!(env!("OUT_DIR"), "/canbus.rs"));

use crate::{auth::Claims, SharedState};
use axum::{body::Bytes, extract::State, http::StatusCode, Extension};
use axum_macros::debug_handler;
use prost::Message;
use std::sync::Arc;

/// CAN Bus frame push handler
#[debug_handler]
pub async fn stream_push(
    State(state): State<Arc<SharedState>>,
    Extension(claims): Extension<Claims>,
    body: Bytes,
) -> Result<String, StatusCode> {
    let machine_id = claims.sub.to_owned().unwrap();

    match Payload::decode(body) {
        Ok(payload) => {
            let frames: Vec<Frame> = payload.frames;

            if frames.is_empty() {
                return Ok("no frames provided".to_string());
            }

            // fill up pipeline
            for frame in frames {
                match state
                    .jetstream
                    .publish(
                        format!("ingest.canbus.{}", machine_id),
                        frame.encode_to_vec().into(),
                    )
                    .await
                {
                    Err(e) => log::error!("Failed to push frame to stream: {}", e),
                    _ => {}
                };
            }

            Ok("success".to_string())
        }
        Err(e) => {
            log::error!("{}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
