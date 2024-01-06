use crate::{state::STATE, ARGS};
use anyhow::{anyhow, Result};
use reqwest::Client;
use std::time::Duration;
use tokio::sync::RwLock;

lazy_static::lazy_static! {
    pub static ref ACCESS_TOKEN: RwLock<String> = RwLock::new(String::new());
    pub static ref REFRESH_TOKEN: RwLock<String> = RwLock::new(String::new());
}

/// Refresh the auth token and return the duration until expiry
pub async fn refresh_token() -> Result<Duration> {
    let state = STATE.read().await?;

    let machine_id = state.machine_id.to_string();
    let machine_secret = state.machine_secret.to_string();

    drop(state);

    let req = Client::new()
        .post(format!("{}/device/v1/token", &ARGS.api_url))
        .query(&[
            ("username", machine_id),
            ("password", machine_secret),
            ("grant_type", "password".to_string()),
            ("scope", "Null".to_string()),
        ])
        .header("Authorization", format!("Bearer {}", &ARGS.api_anon_key));

    let res = req.send().await?;

    #[derive(Deserialize, Debug)]
    struct Response {
        access_token: String,
        refresh_token: String,
        token_type: String,
        expires_in: u64,
    }

    let ok = res.status().is_success();

    if ok {
        let response: Response = res.json().await?;

        *ACCESS_TOKEN.write().await = response.access_token;
        *REFRESH_TOKEN.write().await = response.refresh_token;

        return Ok(Duration::from_secs(response.expires_in));
    } else {
        return Err(anyhow!(
            "Token refresh returned status {:?} with an error: {}",
            &res.status(),
            &res.text().await?
        ));
    }
}

/// Auth token refresh task.
pub async fn task() -> Result<()> {
    // wait a half-hour to refresh token
    tokio::time::sleep(Duration::from_secs(30 * 60)).await;

    loop {
        let interval = refresh_token().await?;
        let interval = interval / 2;
        log::info!(
            "Successfully refreshed auth token. Refreshing again in {} seconds.",
            interval.as_secs()
        );
        tokio::time::sleep(interval).await;
    }
}
