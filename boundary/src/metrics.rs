use axum_prometheus::{GenericMetricLayer, Handle, PrometheusMetricLayer};
use metrics::{describe_counter, describe_histogram, Unit};
use metrics_exporter_prometheus::PrometheusHandle;

/// Setup prometheus and return a handle.
pub fn prometheus() -> (
    GenericMetricLayer<'static, PrometheusHandle, Handle>,
    PrometheusHandle,
) {
    let (mut layer, prom) = PrometheusMetricLayer::pair();

    layer.enable_response_body_size();

    describe_histogram!(
        "boundary_ingest_canbus_payload_size_bytes",
        Unit::Bytes,
        "Payload size in bytes"
    );

    describe_counter!(
        "boundary_ingest_canbus_frames_total",
        "Total number of frames ingested"
    );

    describe_histogram!(
        "boundary_ingest_modbus_payload_size_bytes",
        Unit::Bytes,
        "Payload size in bytes"
    );

    describe_counter!(
        "boundary_ingest_modbus_frames_total",
        "Total number of frames ingested"
    );

    (layer, prom)
}
