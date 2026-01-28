use std::sync::Mutex;
use tauri::State;
use serde::Serialize;

use crate::modules::state::AppState;

/// Session info returned to the frontend
#[derive(Debug, Clone, Serialize)]
pub struct SessionInfo {
    /// Elapsed time in milliseconds since session started
    pub elapsed_ms: u64,
    /// Current session ID (UUID)
    pub session_id: String,
}

#[tauri::command]
/// Returns session information including elapsed time and session ID.
///
/// This Tauri command provides a way for the frontend to check how long the current
/// session has been active and get the session ID for API calls.
///
/// # Arguments
/// * `state` - The global app state containing the session start time and ID
///
/// # Returns
/// `Option<SessionInfo>` - Session info with elapsed time and ID, or `None` if no active session
pub fn get_session_info(state: State<'_, Mutex<AppState>>) -> Option<SessionInfo> {
    let app_state = state.lock().unwrap();
    
    // Check if there's an active session
    let session_id = match &app_state.current_session_id {
        Some(id) => id.clone(),
        None => return None,
    };
    
    // Get the elapsed time since the session started
    if let Some(start_time) = app_state.session_start_time {
        let elapsed = start_time.elapsed();
        Some(SessionInfo {
            elapsed_ms: elapsed.as_millis() as u64,
            session_id,
        })
    } else {
        None
    }
}
