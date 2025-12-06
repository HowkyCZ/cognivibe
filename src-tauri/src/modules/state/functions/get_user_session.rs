use std::sync::Mutex;
use tauri::State;

use crate::modules::state::{AppState, SessionData};

/// Get the current user session data from the application state
/// Returns the session data if a user is logged in, or None if no session exists
#[tauri::command]
pub fn get_user_session(state: State<Mutex<AppState>>) -> Result<Option<SessionData>, String> {
    // Acquire lock on the global app state and retrieve session data
    let app_state = state
        .lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;

    Ok(app_state.session_data.clone())
}
