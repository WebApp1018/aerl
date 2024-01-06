use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Supabase URL
    #[arg(long, env = "SUPABASE_URL")]
    pub supabase_url: String,

    /// Supabase anonkey
    #[arg(long, env = "SUPABASE_ANON_KEY")]
    pub supabase_anon_key: String,

    /// Supabase service key
    #[arg(long, env = "SUPABASE_SERVICE_KEY")]
    pub supabase_service_key: String,

    /// NATS cluster URL
    #[arg(long, env = "NATS_URL")]
    pub nats_url: String,

    /// Mimir URL
    #[arg(long, env = "MIMIR_URL")]
    pub mimir_url: String,

    /// Fly alocation ID
    #[arg(env = "FLY_ALLOC_ID", default_value = "none")]
    pub fly_alloc_id: String,
}
