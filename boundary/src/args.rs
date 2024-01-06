//! CLI Arguments
//!
//! Default value are for local development.

use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// API port
    #[arg(long, env = "BOUNDARY_PORT", default_value_t = 3030)]
    pub port: u16,

    /// Metrics port
    #[arg(long, env = "BOUNDARY_METRICS_PORT", default_value_t = 9091)]
    pub metrics_port: u16,

    /// Supabase URL
    #[arg(long, env = "SUPABASE_URL", default_value = "http://localhost:54321")]
    pub supabase_url: String,

    /// Supabase secret key
    #[arg(
        long,
        env = "SUPABASE_ANON_KEY",
        default_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    )]
    pub supabase_anonkey: String,

    /// Supabase service key
    #[arg(
        long,
        env = "SUPABASE_SERVICE_ROLE_KEY",
        default_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    )]
    pub supabase_service_role_key: String,

    /// Supabase secret key
    #[arg(
        long,
        env = "SUPABASE_SECRETKEY",
        default_value = "super-secret-jwt-token-with-at-least-32-characters-long"
    )]
    pub supabase_secretkey: String,

    /// NATS cluster URL
    #[arg(long, env = "NATS_URL", default_value = "localhost")]
    pub nats_url: String,

    /// Mimir query frontend URL
    #[arg(long, env = "MIMIR_URL", default_value = "http://localhost:8080")]
    pub mimir_url: String,
}
