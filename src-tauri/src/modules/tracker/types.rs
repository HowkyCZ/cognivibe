use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Modifier key state structure for tracking keyboard modifier keys and window switching.
///
/// Tracks the current state of various modifier keys and window switching detection.
/// Used by the input tracking system to monitor keyboard shortcuts and window switching.
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct ModifierState {
    /// Control key pressed state
    pub ctrl_pressed: bool,
    /// Shift key pressed state
    pub shift_pressed: bool,
    /// Alt key pressed state
    pub alt_pressed: bool,
    /// Command key pressed state (for macOS)
    pub cmd_pressed: bool,
    /// Windows key pressed state (for Windows)
    pub win_pressed: bool,
    /// Track if we detected a window switching shortcut
    pub window_switch_detected: bool,
    /// Description of the detected window switch type
    pub window_switch_type: String,
}

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

    /// Scroll wheel events (with debounce gating)
    pub wheel_scroll_events: u32,

    /// Mouse move events (for active_sd calculation)
    pub move_events: u32,

    /// Last recorded X coordinate (used for distance calculation)
    pub last_x: f64,

    /// Last recorded Y coordinate (used for distance calculation)
    pub last_y: f64,

    /// Current mouse movement segment (from last pause)
    #[serde(skip)]
    pub current_segment: Option<MouseSegment>,
    /// Last time mouse moved (for segment boundary)
    #[serde(skip)]
    pub last_segment_time: Option<std::time::Instant>,
    /// Sum of deviation values for completed segments this minute
    pub deviation_sum: f64,
    /// Sum of overshoot values for completed segments this minute
    pub overshoot_sum: f64,
    /// Count of completed segments this minute
    pub segment_count: u32,
}

/// A single mouse movement segment (from pause to pause).
#[derive(Debug, Clone, Default)]
pub struct MouseSegment {
    /// Start position (x, y)
    pub start: (f64, f64),
    /// All sampled points including start and end
    pub points: Vec<(f64, f64)>,
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

    /// Pending key presses (key identifier -> press time) for dwell time
    #[serde(skip)]
    pub pending_key_presses: HashMap<String, std::time::Instant>,
    /// Sum of dwell times in ms for averaging
    pub dwell_time_sum_ms: f64,
    /// Count of key releases with valid dwell time
    pub dwell_time_count: u32,
}
