use clap::Parser;

/// Command line and environment variable arguments.
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// Log level.
    #[arg(short, long, default_value = "info", env = "HUBD_LOG_LEVEL")]
    pub log_level: log::LevelFilter,

    /// Path to the state file.
    #[arg(long, default_value = "/var/lib/hubd", env = "HUBD_STATE_PATH")]
    pub state_path: String,

    /// Supabase API URL.
    #[arg(long, default_value = "https://sb.aerl.cloud", env = "HUBD_SB_API_URL")]
    pub supabase_api_url: String,

    /// Anonymous JWT token.
    #[arg(
        long,
        default_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eW51ZnV0aHZnaHFhbmxrbHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzk5NjkwODUsImV4cCI6MTk5NTU0NTA4NX0.asrx4K_0O9wClwLgcN9W61ab6cOTJqYmiW194mlR4zk",
        env = "HUBD_API_ANON_KEY"
    )]
    pub api_anon_key: String,

    /// API URL.
    #[arg(long, default_value = "https://api.aerl.cloud", env = "HUBD_API_URL")]
    pub api_url: String,
}
