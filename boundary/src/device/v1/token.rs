//! # Auth Token Endpoint
//!
//! This endpoint grants access and refresh JWT's to authorized devices. The
//! intended client for this endpoint is `hubd`, but it may also be used by
//! third party clients in the future.
//!
//! ## Testing
//!
//! ```shell
//! curl -X POST "http://localhost:3030/device/v1/token?grant_type='password'&username='test'&password='test'"
//! ```

use crate::{SharedState, ARGS};
use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    str,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

/// Token grant response
#[derive(Serialize)]
pub struct Response {
    /// Short-lived access token.
    access_token: String,
    /// Token type.
    token_type: String,
    /// Access token expiry in seconds
    expires_in: u64,
    /// Long-lived refresh token.
    refresh_token: String,
}

/// JWT Claims
#[derive(Serialize)]
struct Claims {
    /// Authorization role
    role: String,
    /// Subject, in this case is the machine_id.
    sub: String,
    /// Hub is the hub serial number.
    hub: String,
    /// Expiry time (secconds since unix epoch)
    exp: u64,
    /// Issued at (secconds since unix epoch)
    iat: u64,
    /// Issuer (who created this token)
    iss: String,
}

#[derive(Deserialize)]
pub struct QueryParams {
    /// Grant type.
    grant_type: Option<String>,
    /// Resource owner username.
    username: Option<String>,
    /// Resource owner password.
    password: Option<String>,
    //// The scope of access requeseted.
    scope: Option<String>,
}

pub async fn token(
    params: Query<QueryParams>,
    state: State<Arc<SharedState>>,
) -> Result<Json<Response>, (StatusCode, &'static str)> {
    match params.grant_type.as_deref() {
        Some("password") => {
            let machine_id = match &params.username {
                Some(u) => u,
                None => return Err((StatusCode::BAD_REQUEST, "parameter `username` missing")),
            };

            let machine_secret = match &params.password {
                Some(u) => u,
                None => return Err((StatusCode::BAD_REQUEST, "parameter `password` missing")),
            };

            let _ = params.scope; // scope ignored for now

            let mut hasher = Sha256::new();
            hasher.update(machine_secret);
            let hash = hasher.finalize();

            let machine_secret_hash = format!("{:X}", hash).to_lowercase();

            #[derive(Deserialize)]
            struct HubRow {
                id: String,
                machine_id: String,
            }

            let response = state
                .pg
                .from("hub")
                .auth(&ARGS.supabase_service_role_key)
                .select("id, machine_id")
                .eq("machine_id", machine_id)
                .eq("machine_secret_hash", machine_secret_hash.as_str())
                .execute()
                .await;

            let hubs: Vec<HubRow> = match response {
                Ok(r) => match r.json().await {
                    Ok(r) => r,
                    Err(e) => {
                        log::error!("{}", e);
                        return Err((StatusCode::INTERNAL_SERVER_ERROR, "internal failure"));
                    }
                },
                Err(e) => {
                    log::error!("Postgrest request failed: {}", e);
                    return Err((StatusCode::INTERNAL_SERVER_ERROR, "internal failure"));
                }
            };

            if hubs.len() < 1 {
                return Err((StatusCode::FORBIDDEN, "device not found"));
            }

            let hub = &hubs[0];

            let header = Header::default();
            let key = EncodingKey::from_secret(&ARGS.supabase_secretkey.as_bytes());
            let issued_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
            let issuer = "boundary".to_string();
            let refresh_expiry = (issued_at + Duration::from_secs(60 * 60 * 24 * 90)).as_secs(); // 90 days
            let access_expiry = (issued_at + Duration::from_secs(60 * 60 * 24)).as_secs(); // 24 hours
            let refresh_token = match encode(
                &header,
                &Claims {
                    role: "device".to_string(),
                    sub: hub.machine_id.clone(),
                    hub: hub.id.clone(),
                    iat: issued_at.as_secs(),
                    exp: refresh_expiry,
                    iss: issuer.clone(),
                },
                &key,
            ) {
                Ok(t) => t,
                Err(e) => {
                    log::error!("Failed encoding refresh token: {}", e);
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "failed generating refresh token",
                    ));
                }
            };

            let access_token = match encode(
                &header,
                &Claims {
                    role: "device".to_string(),
                    sub: hub.machine_id.clone(),
                    hub: hub.id.clone(),
                    iat: issued_at.as_secs(),
                    exp: access_expiry,
                    iss: issuer.clone(),
                },
                &key,
            ) {
                Ok(t) => t,
                Err(e) => {
                    log::error!("Failed encoding refresh token: {}", e);
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "failed generating access token",
                    ));
                }
            };

            Ok(Json(Response {
                access_token,
                token_type: "bearer".to_string(),
                expires_in: access_expiry,
                refresh_token,
            }))
        }
        Some("refresh_token") => Err((StatusCode::NOT_IMPLEMENTED, "not implemented")),
        Some(_) => Err((StatusCode::BAD_REQUEST, "invalid `grant_type`")),
        None => Err((StatusCode::BAD_REQUEST, "parameter `grant_type` missing")),
    }
}
