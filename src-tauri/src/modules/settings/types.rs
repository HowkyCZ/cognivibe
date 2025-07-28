use serde::{Deserialize, Serialize};

/// Application settings structure containing user preferences
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    /// Whether the application should start automatically when the system boots
    pub start_on_boot: bool,
    /// Whether to automatically start measuring when the application launches
    pub auto_start_measuring: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            start_on_boot: true,
            auto_start_measuring: true,
        }
    }
}
