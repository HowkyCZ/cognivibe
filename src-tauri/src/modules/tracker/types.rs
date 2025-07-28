use serde::{Deserialize, Serialize};

// Mouse tracking data
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MouseData {
    pub mouse_downs: u64,
    pub mouse_ups: u64,
    pub total_distance: f64,
    pub last_x: f64,
    pub last_y: f64,
    pub last_logged_minute: u8,
}

// Keyboard tracking data
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct KeyboardData {
    pub key_downs: u64,
    pub key_ups: u64,
    pub last_logged_minute: u8,
}
