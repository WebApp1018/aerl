///! Remote PostgREST database
pub mod models;
pub mod schema;

use crate::auth::ACCESS_TOKEN;
use crate::ARGS;
use anyhow::Result;
use postgrest::Postgrest;

/// Grab a connection to supabase postgrest
pub async fn connect() -> Result<Postgrest> {
    let pg = Postgrest::new(ARGS.supabase_api_url.to_string() + "/rest/v1")
        .insert_header(
            "Authorization",
            format!("Bearer {}", &ACCESS_TOKEN.read().await),
        )
        .insert_header("apikey", &ARGS.api_anon_key);

    Ok(pg)
}
