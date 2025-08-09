use serde::{Deserialize, Serialize};

/// Application settings structure containing user preferences
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    /// Whether the application should start automatically when the system boots
    pub should_start_on_boot: bool,
    /// Whether to automatically start measuring when the application launches
    pub should_autostart_measuring: bool,
    /// Delay in milliseconds to wait for the OS to finish updating the foreground window
    /// after UI actions like taskbar minimize/restore or Alt+Tab
    pub window_update_delay_ms: u64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            should_start_on_boot: true,
            should_autostart_measuring: true,
            window_update_delay_ms: 400,
        }
    }
}
