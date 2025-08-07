use std::sync::Mutex;
use tauri::State;

use crate::modules::settings::AppSettings;
use crate::modules::state::AppState;

#[tauri::command]
/// Retrieves the current application settings from the global state.
///
/// This Tauri command returns a copy of the current app settings
/// including preferences like should_start_on_boot and should_autostart_measuring.
/// Used by the frontend to display current settings in the UI.
///
/// This function is part of the state module since it's a pure state query
/// without any domain logic or side effects.
///
/// # Arguments
/// * `state` - The global app state containing current settings
///
/// # Returns
/// A clone of the current AppSettings structure
pub fn get_settings_state(state: State<'_, Mutex<AppState>>) -> AppSettings {
    let state = state.lock().unwrap();
    state.settings.clone()
}
