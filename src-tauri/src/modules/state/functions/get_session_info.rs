use std::sync::Mutex;
use tauri::State;

use crate::modules::state::AppState;

#[tauri::command]
/// Returns the elapsed time since the session started in milliseconds.
///
/// This Tauri command provides a way for the frontend to check how long the current
/// session has been active, allowing it to determine if the session has been active
/// for a certain duration (e.g., 10 minutes).
///
/// # Arguments
/// * `state` - The global app state containing the session start time
///
/// # Returns
/// `Option<u64>` - Elapsed time in milliseconds since session started, or `None` if no active session
pub fn get_session_info(state: State<'_, Mutex<AppState>>) -> Option<u64> {
    let app_state = state.lock().unwrap();
    
    // Check if there's an active session
    if app_state.current_session_id.is_none() {
        return None;
    }
    
    // Get the elapsed time since the session started
    if let Some(start_time) = app_state.session_start_time {
        let elapsed = start_time.elapsed();
        Some(elapsed.as_millis() as u64)
    } else {
        None
    }
}
