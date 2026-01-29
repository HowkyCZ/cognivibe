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
    #[cfg(debug_assertions)]
    println!("[GET_SESSION_INFO] 🔍 Retrieving session info...");
    
    let app_state = match state.lock() {
        Ok(state) => state,
        Err(_e) => {
            #[cfg(debug_assertions)]
            eprintln!("[GET_SESSION_INFO] ❌ Failed to lock app state: {}", _e);
            return None;
        }
    };
    
    // Check if there's an active session
    let session_id = match &app_state.current_session_id {
        Some(id) => {
            #[cfg(debug_assertions)]
            println!("[GET_SESSION_INFO] ✅ Found session_id: {}", id);
            id.clone()
        }
        None => {
            #[cfg(debug_assertions)]
            println!("[GET_SESSION_INFO] ⚠️ No active session_id found");
            return None;
        }
    };
    
    // Get the elapsed time since the session started
    match app_state.session_start_time {
        Some(start_time) => {
            let elapsed = start_time.elapsed();
            let elapsed_ms = elapsed.as_millis() as u64;
            let _elapsed_minutes = elapsed_ms / (1000 * 60);
            #[cfg(debug_assertions)]
            println!("[GET_SESSION_INFO] ✅ Session info retrieved: {}ms ({} minutes)", elapsed_ms, _elapsed_minutes);
            Some(SessionInfo {
                elapsed_ms,
                session_id,
            })
        }
        None => {
            #[cfg(debug_assertions)]
            eprintln!("[GET_SESSION_INFO] ❌ Session ID exists but no start_time - inconsistent state!");
            None
        }
    }
}
