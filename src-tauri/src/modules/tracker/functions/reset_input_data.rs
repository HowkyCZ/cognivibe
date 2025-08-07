use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;
use crate::modules::tracker::types::{KeyboardData, MouseData};
use crate::modules::utils::get_tracker_prefix;

/// Resets both mouse and keyboard tracking data to default values.
/// Called when measurement starts to ensure clean data collection.
pub fn reset_input_data(app_handle: &AppHandle) {
    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
        app_state.mouse_data = MouseData::default();
        app_state.keyboard_data = KeyboardData::default();
        app_state.is_first_minute = true;

        #[cfg(debug_assertions)]
        println!("{}🔄 Tracking data reset", get_tracker_prefix());
    }
}
