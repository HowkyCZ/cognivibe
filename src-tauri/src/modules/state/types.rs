use crate::modules::settings::AppSettings;
use crate::modules::tracker::{KeyboardData, MouseData};

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
}
