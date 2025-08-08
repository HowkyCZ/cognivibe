use serde::{Deserialize, Serialize};

/// Mouse tracking data structure that captures various mouse interaction metrics.
///
/// Tracks different types of mouse activity including clicks, movement distance,
/// and scroll activity. All counters are reset every minute during logging.
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MouseData {
    /// Left mouse button clicks (primary button)
    pub left_clicks: u32,

    /// Right mouse button clicks (secondary button, context menu)
    pub right_clicks: u32,

    /// Other mouse button clicks (middle button, side buttons, etc.)
    pub other_clicks: u32,

    /// Total mouse movement distance in pixels (Euclidean: √(dx² + dy²))
    pub total_distance: f64,

    /// Total absolute scroll wheel distance (horizontal + vertical)
    pub wheel_scroll_distance: f64,

    /// Last recorded X coordinate (used for distance calculation)
    pub last_x: f64,

    /// Last recorded Y coordinate (used for distance calculation)
    pub last_y: f64,
}

/// Keyboard tracking data structure that captures keyboard interaction metrics.
///
/// Tracks keyboard activity by counting key press and release events.
/// All counters are reset every minute during logging.
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct KeyboardData {
    /// Key press events (when a key is pressed down), including delete keys
    pub key_downs: u32,

    /// Key release events (when a key is released), including delete keys
    pub key_ups: u32,

    /// Delete key downs (Backspace and Delete keys pressed)
    pub delete_downs: u32,

    /// Delete key ups (Backspace and Delete keys released)
    pub delete_ups: u32,
}
