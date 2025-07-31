use std::sync::Mutex;
use tauri::State;

use crate::modules::state::AppState;

#[tauri::command]
/// Returns the current measuring state of the application.
///
/// This Tauri command provides a simple way for the frontend to check
/// whether input tracking is currently active. Used by the UI to display
/// the correct measuring status and update relevant controls.
///
/// # Arguments
/// * `state` - The global app state containing the measuring flag
///
/// # Returns
/// `true` if currently measuring input, `false` if measurement is stopped
pub fn get_measuring_state(state: State<'_, Mutex<AppState>>) -> bool {
    let state = state.lock().unwrap();
    state.is_measuring
}
