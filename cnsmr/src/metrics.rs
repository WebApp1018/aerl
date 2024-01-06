use anyhow::{Context, Result};
use axum::routing::get;
use axum::Router;
use metrics::describe_counter;
use prometheus::{Encoder, TextEncoder};
use std::net::SocketAddr;
use tokio::net::TcpListener;

/// Setup metrics
pub fn metrics() {
    describe_counter!(
        "cnsmr_ingest_canbus_frames_total",
        "Total number of processed frames"
    );

    describe_counter!(
        "cnsmr_ingest_canbus_frames_failed",
        "Number of frames that failed to process correctly"
    );

    describe_counter!(
        "cnsmr_ingest_modbus_frames_total",
        "Total number of processed frames"
    );

    describe_counter!(
        "cnsmr_ingest_modbus_frames_failed",
        "Number of frames that failed to process correctly"
    );
}

pub async fn render() -> String {
    let mut buffer = vec![];
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    String::from_utf8(buffer).unwrap()
}

pub async fn task() -> Result<()> {
    let app = Router::new()
        .route("/metrics", get(move || render()))
        .route("/ready", get(|| async { "true" }))
        .route("/healthy", get(|| async { "true" }));

    let addr = SocketAddr::from(([0, 0, 0, 0], 9091));
    let listener = TcpListener::bind(addr).await?;

    log::info!("Metrics listening on http://{}", addr);

    axum::serve(listener, app).await.context("metrics server")
}
