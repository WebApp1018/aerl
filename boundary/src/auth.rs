use crate::ARGS;
use anyhow::Result;
use axum::{
    body::Body,
    http,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{DecodingKey, Validation};
use serde::{Deserialize, Serialize};

/// Token payload
///
/// This must deserialize correctly for both Supabase generated tokens and our
/// custom tokens for devices.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Claims {
    pub sub: Option<String>,
    pub role: String,
    pub exp: usize,
}

pub async fn validate(
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, (StatusCode, &'static str)> {
    let auth_header = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let auth_header = if let Some(auth_header) = auth_header {
        auth_header
    } else {
        return Err((StatusCode::UNAUTHORIZED, "unauthorized"));
    };

    let token = auth_header.replace("Bearer ", "");

    let decoding_key = &DecodingKey::from_secret(&ARGS.supabase_secretkey.as_bytes());

    let mut validation = Validation::default();
    validation.set_audience(&["authenticated"]);

    match jsonwebtoken::decode::<Claims>(&token, &decoding_key, &validation).map(|data| data.claims)
    {
        Ok(claims) => {
            req.extensions_mut().insert(claims);
            Ok(next.run(req).await)
        }
        Err(e) => {
            log::info!("Authentication failed: {}", e);
            Err((StatusCode::UNAUTHORIZED, "unauthorized"))
        }
    }
}
