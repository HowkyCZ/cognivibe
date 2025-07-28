use std::sync::Mutex;
use tauri::State;

use crate::modules::state::AppState;
use super::reset_input_data::reset_input_data;

#[tauri::command]
/// Toggles the measurement state of the application.
/// 
/// This Tauri command switches between measuring and not measuring states.
/// When starting measurement (turning ON):
/// - Resets all input tracking data to start fresh
/// - Logs the start of measurement
/// 
/// When stopping measurement (turning OFF):
/// - Stops data collection but preserves current data
/// - Logs the stop of measurement
/// 
/// # Arguments
/// * `state` - The global app state containing the measuring flag
/// * `app` - The Tauri app handle for resetting tracking data
/// 
/// # Returns
/// The new measuring state (true if now measuring, false if stopped)
pub fn toggle_measuring(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> bool {
    let is_starting_measurement;
    let current_state;

    {
        let mut app_state = state.lock().unwrap();
        // Toggle the measuring state
        app_state.is_measuring = !app_state.is_measuring;
        is_starting_measurement = app_state.is_measuring;
        current_state = app_state.is_measuring;
    }

    if is_starting_measurement {
        #[cfg(debug_assertions)]
        println!("Started measuring");
        // Reset mouse and keyboard tracking data when starting measurement
        reset_input_data(&app);
    } else {
        #[cfg(debug_assertions)]
        println!("Stopped measuring");
    }

    // Return the current measuring state
    current_state
}
