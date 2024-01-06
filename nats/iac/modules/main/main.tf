terraform {
  required_providers {
    jetstream = {
      source  = "nats-io/jetstream"
      version = "0.0.35"
    }
  }
}

// CAN Bus Frame Ingest Stream
resource "jetstream_stream" "ingest_canbus" {
  name     = "telemetry_ingest"
  subjects = ["ingest.canbus.*"]
  storage  = "file"
  max_age  = 60 * 60 * 24 * 60 // 60 days
  replicas = 1
  retention = "workqueue"
}

resource "jetstream_consumer" "cnsmr_canbus" {
    stream_id = jetstream_stream.ingest_canbus.id
    durable_name = "cnsmr_canbus"
    deliver_all = true
    max_delivery = 5
    replicas = 1
}
