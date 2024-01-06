use crate::ARGS;
use anyhow::{Context, Result};
use rand::{distributions::Alphanumeric, Rng};
use serde::Serialize;
use std::fs::OpenOptions;
use std::io::{Read, Write};
use tokio::sync::{Mutex, MutexGuard};

lazy_static::lazy_static! {
    pub static ref STATE: StateFile = StateFile::new(&format!("{}/hubd.state", ARGS.state_path)).unwrap();
}

/// State object.
#[derive(Serialize, Deserialize, Default, Clone)]
pub struct State {
    pub machine_id: String,
    pub machine_secret: String,
}

/// State file data.
pub struct StateFile {
    file_path: String,
    state: Mutex<State>,
}

impl StateFile {
    /// Create a new state file instance, opening the state file given in the
    /// `path` argument.
    pub fn new(path: &str) -> Result<StateFile> {
        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(path)
            .context("Could not open or create state file.")?;

        let mut contents = String::new();

        file.read_to_string(&mut contents)?;

        // don't parse if empty
        let mut state =
            match serde_json::from_str(&contents) {
                Ok(value) => value,
                Err(_) => State::default(),
            };

        if state.machine_id.is_empty() {
            // get machine id from system
            state.machine_id = rand::thread_rng()
                .sample_iter(&Alphanumeric)
                .take(32)
                .map(char::from)
                .collect();
        }

        if state.machine_secret.is_empty() {
            // generate secret key
            state.machine_secret = rand::thread_rng()
                .sample_iter(&Alphanumeric)
                .take(64)
                .map(char::from)
                .collect();
        }

        let json = serde_json::to_string_pretty::<State>(&state)?;
        file.write_all(json.as_bytes())?;

        let state = Mutex::new(state);

        let mut this = StateFile {
            file_path: path.to_string(),
            state,
        };

        futures::executor::block_on(this.persist())?;

        Ok(this)
    }

    /// Read the state from memory.
    pub async fn read(&self) -> Result<MutexGuard<State>> {
        let state = self.state.lock().await;

        Ok(state)
    }

    /// Persist state to filesystem.
    pub async fn persist(&mut self) -> Result<()> {
        let lock = &self.state.lock().await;
        let json = serde_json::to_string_pretty::<State>(lock)?;

        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&self.file_path)
            .context("Could not open or create state file.")?;

        file.write_all(json.as_bytes())?;

        Ok(())
    }
}
