use crate::{auth::Claims, ARGS};
use axum::{
    http::{HeaderMap, StatusCode},
    Extension, Json,
};
use axum_macros::debug_handler;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    /// Groups.
    groups: Vec<Group>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Group {
    /// Group name.
    name: String,
    /// Used for multi-tenancy.
    source_tenants: Vec<String>,
    /// Rule list.
    rules: Vec<Rule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Rule {
    /// Alert name.
    alert: String,
    /// Query expression.
    expr: String,
    /// Duration.
    #[serde(rename = "for")]
    for_duration: String,
    /// Additional labels, overwriting existing conflicting labels.
    labels: Option<HashMap<String, String>>,
    /// Information labels that can be templated.
    annotations: Option<HashMap<String, String>>,
}

/// Device row.
#[derive(Debug, Deserialize, Clone)]
#[allow(unused)]
pub struct DeviceRow {
    id: u64,
    key: String,
}

/// Organization row.
#[derive(Debug, Deserialize, Clone)]
#[allow(unused)]
pub struct OrgRow {
    id: u64,
    key: String,
}

/// Table record.
#[derive(Debug, Deserialize)]
#[allow(unused)]
struct RuleRow {
    id: u64,
    applied_at: Option<String>,
    org_id: u64,
    rule: Rule,
}

/// Webhook payload.
#[derive(Debug, Deserialize)]
pub struct WebhookPayload {
    #[serde(rename = "type")]
    event_type: String,
    table: String,
    schema: String,
    record: Option<RuleRow>,
    old_record: Option<RuleRow>,
}

#[debug_handler]
pub async fn webhook(
    headers: HeaderMap,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<WebhookPayload>,
) -> Result<Json<Value>, StatusCode> {
    // check role is correct
    if claims.role != "service_role" {
        log::info!("JWT auth role incorrect.");
        return Err(StatusCode::UNAUTHORIZED);
    }

    // check for correct schema source
    if payload.schema != "public" {
        log::info!("Invalid schema provided.");
        return Err(StatusCode::BAD_REQUEST);
    }

    // check for correct table source
    if payload.table != "alert_rule" {
        log::info!("Invalid table provided.");
        return Err(StatusCode::BAD_REQUEST);
    }

    // get auth token
    let token = match headers.get("authorization") {
        Some(t) => match t.to_str() {
            Ok(v) => v.replace("Bearer ", ""),
            Err(_) => {
                log::info!("Missing JWT.");
                return Err(StatusCode::UNAUTHORIZED);
            }
        },
        None => {
            log::info!("Missing JWT.");
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // create PostgREST client
    let pg = postgrest::Postgrest::new(ARGS.supabase_url.to_string() + "/rest/v1")
        .insert_header("apikey", &ARGS.supabase_anonkey);

    let org_id = match get_record_org_id(&payload) {
        Ok(v) => v,
        Err(e) => {
            log::info!("Failed to extract org id: {}", e);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    // get all alert rules for organization
    let rules: Vec<RuleRow> = match pg
        .from("alert_rule")
        .auth(&token)
        .eq("org_id", org_id.to_string())
        .select("id, org_id, rule")
        .execute()
        .await
    {
        Ok(res) => match res.json().await {
            Ok(rules) => rules,
            Err(e) => {
                log::info!("Failed getting json body: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        },
        Err(e) => {
            log::info!("Failed getting response: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // map into new type
    let rules: Vec<Rule> = rules.iter().map(|r| r.rule.clone()).collect();

    // get device tenants
    let devices: Vec<DeviceRow> = match pg
        .from("device")
        .auth(&token)
        .eq("org_id", org_id.to_string())
        .select("id, key")
        .execute()
        .await
    {
        Ok(res) => match res.json().await {
            Ok(rules) => rules,
            Err(e) => {
                log::info!("Failed getting json body: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        },
        Err(e) => {
            log::info!("Failed getting response: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let source_tenants: Vec<String> = devices.iter().map(|d| d.key.clone()).collect();

    let group = Group {
        name: "Default".to_string(),
        source_tenants,
        rules,
    };

    // get organization
    let org: Vec<OrgRow> = match pg
        .from("org")
        .auth(&token)
        .eq("id", org_id.to_string())
        .select("id, key")
        .execute()
        .await
    {
        Ok(res) => match res.json().await {
            Ok(rules) => rules,
            Err(e) => {
                log::info!("Failed getting json body: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        },
        Err(e) => {
            log::info!("Failed getting response: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // add a prefix to the org key so we don't collide with the device
    // tenants.
    let org_tenant = match org.first() {
        Some(org) => format!("org-{}", &org.key),
        None => {
            log::info!("No orgs found.");
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    // serialize the alert config body
    let body = match serde_yaml::to_string(&group) {
        Ok(b) => b,
        Err(e) => {
            log::info!("Deserialization failed: {}", e);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let response = Client::new()
        .post(format!(
            "{}/prometheus/config/v1/rules/alerting",
            &ARGS.mimir_url
        ))
        .header("X-Scope-OrgID", org_tenant)
        .body(body)
        .send()
        .await;

    match response {
        Ok(v) => {
            if v.status().is_success() {
                match pg
                    .from("alert_rule")
                    .auth(&token)
                    .eq("org_id", org_id.to_string())
                    .update(json!({ "applied_at": "now()"}).to_string())
                    .execute()
                    .await
                {
                    Ok(_) => log::info!("Applied rules."),
                    Err(e) => log::error!("Failed applying rules: {}", e),
                }

                Ok(Json(json!({"message": "ok"})))
                // update `applied_at` column for rows that were used.
            } else {
                log::error!("Got an error from mimir: {:?}", v.text().await);

                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
        Err(e) => {
            log::info!("Mimir responded with an error: {}", e);
            return Err(StatusCode::BAD_REQUEST);
        }
    }
}

fn get_record_org_id(payload: &WebhookPayload) -> Result<u64, &'static str> {
    match payload.event_type.as_str() {
        "INSERT" | "UPDATE" => match &payload.record {
            Some(r) => Ok(r.org_id),
            None => Err("No record provided."),
        },
        "DELETE" => match &payload.old_record {
            Some(r) => Ok(r.org_id),
            None => Err("No old record provided."),
        },
        _ => Err("Invalid event type."),
    }
}
