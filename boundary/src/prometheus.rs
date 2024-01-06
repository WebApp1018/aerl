use std::sync::Arc;

use crate::{auth::Claims, SharedState, ARGS};
use axum::{
    extract::{Path, RawQuery, State},
    http::{HeaderMap, StatusCode},
    Extension, Json,
};
use axum_macros::debug_handler;
use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;

/// Forward requests with appropriate tenant header.
///
/// Steps:
///     0. HTTP verb is valid.
///     1. Get path and check it is valid.
///     2. Query Supabase for org keys.
///     3. Add org keys to Prometheus request.
///     4. Return response from Prometheus.
#[debug_handler]
pub async fn api(
    Path(path): Path<String>,
    headers: HeaderMap,
    RawQuery(query): RawQuery,
    State(state): State<Arc<SharedState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, StatusCode> {
    // allow certain paths
    match path.to_owned().as_ref() {
        "query" | "query_range" | "query_exemplars" | "series" | "labels" | "metadata" => {}
        path if path.starts_with("label/") && path.ends_with("/values") => {}
        _ => return Err(StatusCode::NOT_FOUND),
    };

    let token = match headers.get("authorization") {
        Some(t) => match t.to_str() {
            Ok(v) => v,
            Err(_) => return Err(StatusCode::UNAUTHORIZED),
        },
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let sub = match &claims.sub {
        Some(s) => s,
        None => {
            log::info!("Missing `sub` claim in JWT.");
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    let tenants = match state.user_metric_tenants.get(sub).await {
        Some(t) => t,
        None => {
            #[derive(Deserialize)]
            struct DeviceRow {
                key: String,
            }

            // get organizations the user has access to
            let device_rows = match state
                .pg
                .from("device")
                .auth(token.replace("Bearer ", ""))
                .select("key")
                .execute()
                .await
            {
                Err(e) => {
                    log::error!("An error was returned by the PostgREST: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
                Ok(res) => match res.text().await {
                    Ok(text) => match serde_json::from_str::<Vec<DeviceRow>>(&text) {
                        Err(error) => {
                            log::error!(
                                "Failed deserializing the PostgREST response {}: {}",
                                text,
                                error
                            );
                            return Err(StatusCode::INTERNAL_SERVER_ERROR);
                        }
                        Ok(keys) => keys,
                    },
                    Err(e) => {
                        log::error!("Failed to get PostgREST response body: {}", e);
                        return Err(StatusCode::INTERNAL_SERVER_ERROR);
                    }
                },
            };

            if device_rows.is_empty() {
                log::trace!("User does not have any devices registered.");
                return Err(StatusCode::OK);
            }

            let keys: Vec<String> = device_rows.into_iter().map(|k| k.key).collect();

            let tenants = keys.join("|");

            state
                .user_metric_tenants
                .insert(sub.to_string(), tenants.clone())
                .await;

            tenants
        }
    };

    let url = format!(
        "{}/prometheus/api/v1/{}?{}",
        ARGS.mimir_url,
        path,
        query.unwrap()
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .header("X-Scope-OrgID", tenants)
        .send()
        .await;

    match response {
        Err(error) => {
            // Handle the error in an appropriate way (e.g., logging, error response)
            log::error!("Faile getting response from Prometheus: {}", error);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        Ok(res) => {
            // Deserialize the response body into the PrometheusResponse struct
            let json: Value = match res.json().await {
                Err(e) => {
                    log::error!("Failed to deserialize the response from Prometheus: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
                Ok(v) => v,
            };

            Ok(Json(json))
        }
    }
}
