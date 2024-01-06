use crate::{state::STATE, ARGS};
use anyhow::Result;
use std::time::Duration;

pub async fn task() -> Result<()> {
    loop {
        let state = STATE.read().await?;

        let req = reqwest::Client::new()
            .post(format!("{}/device/v1/heartbeat", &ARGS.api_url))
            .header("Authorization", format!("Bearer {}", &ARGS.api_anon_key))
            .json(&serde_json::json!({
                "machine_id": state.machine_id.to_string(),
            }));

        let res =
            match req.send().await {
                Ok(r) => r,
                Err(e) => {
                    log::error!("Heartbeat request failed: {}.", e);
                    log::error!("Retrying heartbeat in 15 seconds");
                    tokio::time::sleep(Duration::from_secs(15)).await;
                    continue;
                }
            };

        match res.error_for_status() {
            Ok(_) => log::info!("Sent heartbeat"),
            Err(e) => log::error!("Heartbeat request returned error: {}", e),
        }

        tokio::time::sleep(Duration::from_secs(30)).await;
    }
}
