mod args;
mod auth;
mod canbus;
mod device;
mod metrics;
mod mimir;
mod modbus;
mod prometheus;

use anyhow::{Context, Result};
use args::Args;
use axum::{
    http::{StatusCode, Uri},
    middleware,
    routing::{get, post},
    Router,
};
use clap::Parser;
use moka::future::Cache;
use std::{future::ready, net::SocketAddr, sync::Arc, time::Duration};
use tower_http::cors::{Any, CorsLayer};

lazy_static::lazy_static! {
    static ref ARGS: Args = Args::parse();
}

#[derive(Clone)]
pub struct SharedState {
    pub jetstream: async_nats::jetstream::Context,
    pub pg: postgrest::Postgrest,
    pub user_metric_tenants: Cache<String, String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let shared_state = Arc::new(SharedState {
        jetstream: async_nats::jetstream::new(async_nats::connect(&ARGS.nats_url).await?),
        pg: postgrest::Postgrest::new(ARGS.supabase_url.to_string() + "/rest/v1")
            .insert_header("apikey", &ARGS.supabase_anonkey),
        user_metric_tenants: Cache::builder()
            .name("user-metric-tenants")
            .time_to_live(Duration::from_secs(10))
            .max_capacity(10_000)
            .initial_capacity(1_000)
            .build(),
    });

    let (prometheus_layer, prometheus_handle) = metrics::prometheus();

    let external = Router::new()
        .route("/stream/canbus/push", post(canbus::stream_push))
        .route("/stream/modbus/push", post(modbus::stream_push))
        .route(
            "/prometheus/api/v1/:path",
            get(prometheus::api).post(prometheus::api),
        )
        .route("/webhook/config/alerts", post(mimir::webhook))
        .nest("/device/v1", device::v1::router())
        .route_layer(middleware::from_fn(auth::validate))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_headers(Any)
                .allow_methods(Any),
        )
        .layer(prometheus_layer)
        .fallback(fallback)
        .with_state(shared_state);

    let internal = Router::new()
        .route("/metrics", get(move || ready(prometheus_handle.render())))
        .route("/ready", get(|| async { "true" }))
        .route("/healthy", get(|| async { "true" }))
        .fallback(fallback);

    tokio::select! {
        e = serve(internal, ARGS.metrics_port) => log::error!("Internal endpoint failed: {e:?}"),
        e = serve(external, ARGS.port) => log::error!("External endpoint failed: {e:?}"),
    };

    Err(anyhow::anyhow!("Failed"))
}

/// Serve app router on a given port.
async fn serve(app: Router, port: u16) -> Result<()> {
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    axum::serve(listener, app)
        .await
        .context("Server creation error")
}

/// Fallback to a 404 response.
async fn fallback(uri: Uri) -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, format!("no route for {uri}"))
}
