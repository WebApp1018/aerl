use std::collections::HashMap;

pub struct SerialNumberStore {
    cache: HashMap<String, String>,
}

impl SerialNumberStore {
    pub fn new() -> SerialNumberStore {
        SerialNumberStore {
            cache: HashMap::new(),
        }
    }

    pub fn append(&mut self, path: &[&str], serial: String) {
        self.cache.insert(path.join(":"), serial);
    }

    pub fn get(&self, path: &[&str]) -> Option<String> {
        self.cache.get(&path.join(":")).cloned()
    }
}
