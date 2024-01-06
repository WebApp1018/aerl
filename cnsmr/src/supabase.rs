use crate::ARGS;
use anyhow::Result;
use postgrest::Postgrest;
use serde::Deserialize;
use tokio::sync::RwLock;

lazy_static::lazy_static! {
    pub static ref DEVICES: RwLock<Vec<Device>> = RwLock::new(Vec::new());

    static ref PGREST: Postgrest = Postgrest::new(ARGS.supabase_url.to_string() + "/rest/v1")
        .insert_header(
            "Authorization",
            format!("Bearer {}", &ARGS.supabase_service_key),
        )
        .insert_header("apikey", &ARGS.supabase_anon_key);
}

#[derive(Debug, Deserialize, Clone)]
#[allow(unused)]
pub struct Org {
    pub id: u64,
    pub key: String,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(unused)]
pub struct Hub {
    pub id: String,
    pub machine_id: String,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(unused)]
pub struct Device {
    pub id: u64,
    pub org: Org,
    pub hub: Hub,
    pub key: String,
}

pub async fn refresh_devices() -> Result<()> {
    log::trace!("Updating device registrations");

    // get registrations
    let resp = PGREST
        .from("device")
        .select("id, hub!inner(id, machine_id), org!inner(id, key), key")
        .execute()
        .await?;

    let body = resp.text().await?;

    let registrations: Vec<Device> = serde_json::from_str(&body)?;
    *DEVICES.write().await = registrations;

    Ok(())
}
