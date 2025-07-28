use std::sync::Mutex;
use tauri::State;

use crate::modules::state::AppState;
use super::super::types::AppSettings;

#[tauri::command]
/// Retrieves the current application settings.
/// 
/// This Tauri command returns a copy of the current app settings
/// including preferences like start_on_boot and auto_start_measuring.
/// Used by the frontend to display current settings in the UI.
/// 
/// # Arguments
/// * `state` - The global app state containing current settings
/// 
/// # Returns
/// A clone of the current AppSettings structure
pub fn get_settings_cmd(state: State<'_, Mutex<AppState>>) -> AppSettings {
    let state = state.lock().unwrap();
    state.settings.clone()
}
