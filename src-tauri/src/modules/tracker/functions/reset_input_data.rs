use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;
use crate::modules::tracker::types::{KeyboardData, MouseData};

/// Resets both mouse and keyboard tracking data to their default (zero) values.
///
/// This function is typically called when measurement starts to ensure
/// clean data collection from the beginning of each measurement session.
/// It clears all accumulated counts and distances, preparing for fresh tracking.
///
/// # Arguments
/// * `app_handle` - Reference to the Tauri app handle for accessing global state
pub fn reset_input_data(app_handle: &AppHandle) {
    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
        app_state.mouse_data = MouseData::default();
        app_state.keyboard_data = KeyboardData::default();
        #[cfg(debug_assertions)]
        println!("Mouse and keyboard tracking data reset");
    }
}
