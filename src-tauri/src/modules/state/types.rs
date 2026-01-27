use crate::modules::settings::AppSettings;
use crate::modules::tracker::{KeyboardData, MouseData};
use serde::{Deserialize, Serialize};
use std::time::Instant;

/// Session data received from the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    pub user_id: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
}

/// Application state to track measuring status and store runtime data
#[derive(Debug, Default)]
pub struct AppState {
    /// Whether input tracking/measuring is currently active
    pub is_measuring: bool,
    /// Whether this is the first minute of measurement (to ignore half-minute data)
    pub is_first_minute: bool,
    /// Application settings and user preferences
    pub settings: AppSettings,
    /// Mouse tracking data (clicks, movement distance, etc.)
    pub mouse_data: MouseData,
    /// Keyboard tracking data (key presses, releases, etc.)
    pub keyboard_data: KeyboardData,
    /// Currently active window ID
    pub active_window_id: Option<String>,
    /// Currently active window/tab title
    pub active_window_title: Option<String>,
    /// Currently active application name
    pub active_app_name: Option<String>,
    /// Current user session data from Supabase
    pub session_data: Option<SessionData>,
    /// Screen resolution multiplier for mouse distance normalization
    pub screen_resolution_multiplier: Option<f64>,
    /// Window/app change count
    pub window_change_count: u32,
    /// Last scroll event timestamp for debouncing
    pub last_scroll_event_time: Option<std::time::Instant>,
    /// Last mouse move event timestamp for gating (200ms window)
    pub last_mouse_move_time: Option<std::time::Instant>,
    /// Currently active app category
    pub current_app_category: Option<String>,
    /// History of category changes for majority calculation
    pub category_change_history: Vec<CategoryChangeEvent>,
    /// Current active session ID (UUID)
    pub current_session_id: Option<String>,
    /// Last time a minute log was successfully uploaded (for inactivity detection)
    pub last_activity_time: Option<Instant>,
    /// When the current session started
    pub session_start_time: Option<Instant>,
}

/// Represents a category change event for tracking time spent in each category
#[derive(Debug, Clone)]
pub struct CategoryChangeEvent {
    /// Category enum value
    pub category: String,
    /// Timestamp when category changed
    pub timestamp: Instant,
    /// App name that triggered this category
    pub app_name: String,
}
