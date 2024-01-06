mod heartbeat;
mod token;

use crate::SharedState;
use axum::{routing::post, Router};
use std::sync::Arc;

/// Device API router
pub fn router() -> axum::Router<Arc<SharedState>> {
    Router::new()
        .route("/token", post(token::token))
        .route("/heartbeat", post(heartbeat::heartbeat))
}
