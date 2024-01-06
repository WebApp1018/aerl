use crate::SharedState;
use crate::ARGS;
use axum::{extract::State, http::StatusCode, Json};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use std::{sync::Arc, time::SystemTime};

#[derive(Debug, Deserialize)]
pub struct Payload {
    machine_id: String,
}

#[derive(Debug, Deserialize)]
pub struct HubRow {
    id: String,
}

/// Heartbeat endpoint
///
/// Periodically called by edge devices to indicate their health.
pub async fn heartbeat(
    State(state): State<Arc<SharedState>>,
    Json(payload): Json<Payload>,
) -> Result<String, StatusCode> {
    // bounds check for the sake of it
    if payload.machine_id.len() > 255 {
        return Err(StatusCode::NOT_ACCEPTABLE);
    }

    let res = state
        .pg
        .from("hub")
        .auth(&ARGS.supabase_service_role_key)
        .select("id")
        .eq("machine_id", &payload.machine_id)
        .single()
        .execute();

    let res = match res.await {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to query `hub` table: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if !res.status().is_success() {
        log::error!("Could not query `hub`: {:?}", res.text().await);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    let row: HubRow = match res.json().await {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to parse json body: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let res = state
        .pg
        .from("device")
        .update(json!({"last_seen": time_now_rfc3339()}).to_string())
        .eq("hub_id", row.id)
        .execute();

    let res = match res.await {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to update `last_seen` time: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if !res.status().is_success() {
        log::error!(
            "Update `last_seen` was not successful: {:?}",
            res.text().await
        );
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    log::info!("Got heartbeat from machine_id: {}", &payload.machine_id);

    Ok("ok".to_string())
}

/// Fetch system time in RFC3339 format.
fn time_now_rfc3339() -> String {
    let now: DateTime<Utc> = SystemTime::now().into();
    now.to_rfc3339()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_time_now_iso8601_format() {
        let iso8601_string = time_now_rfc3339();

        // Test that the string represents a valid DateTime in RFC 3339 format.
        assert!(
            DateTime::parse_from_rfc3339(&iso8601_string).is_ok(),
            "The string '{}' is not a valid RFC 3339 date and time.",
            iso8601_string
        );
    }
}
