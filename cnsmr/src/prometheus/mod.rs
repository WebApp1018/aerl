use anyhow::{anyhow, Result};
use prost::Message;
use reqwest::{Client, Method, StatusCode, Url};
use std::str::FromStr;
use std::time::Duration;

include!(concat!(env!("OUT_DIR"), "/prometheus.rs"));

lazy_static::lazy_static! {
    static ref HTTP_CLIENT: Client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap();
}

pub async fn push(url: &str, tenant: &String, timeseries: Vec<TimeSeries>) -> Result<()> {
    let mut push_url = if url.contains("://") {
        url.to_owned()
    } else {
        format!("http://{}", url)
    };

    if push_url.ends_with('/') {
        push_url.pop();
    }

    push_url = format!("{}/api/v1/push", push_url);

    let write_request = WriteRequest {
        timeseries,
        metadata: vec![],
    };

    let data = write_request.encode_to_vec();

    let compressed = snap::raw::Encoder::new().compress_vec(&data).unwrap();

    let builder = HTTP_CLIENT
        .request(Method::POST, Url::from_str(&push_url).unwrap())
        .header("Content-Type", "application/x-protobuf")
        .header("Content-Encoding", "snappy")
        .header("X-Scope-OrgID", tenant) // later this needs to be the org key
        .header("X-Prometheus-Remote-Write-Version", "0.1.0")
        .body(compressed);

    let response = builder.send().await?;

    match response.status() {
        StatusCode::ACCEPTED => Ok(()),
        StatusCode::OK => Ok(()),
        _ => Err(anyhow!(
            "Unexpected status code {} while pushing to {}",
            response.status(),
            push_url
        )),
    }
}
