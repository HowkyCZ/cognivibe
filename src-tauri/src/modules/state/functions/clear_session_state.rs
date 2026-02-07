use std::sync::Mutex;
use tauri::State;

use crate::modules::state::AppState;
#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;

/// Clear the current session state (session_id, start_time, last_activity_time)
/// This is called when a session ends via the frontend (e.g., questionnaire submission)
#[tauri::command]
pub fn clear_session_state(state: State<Mutex<AppState>>) -> Result<(), String> {
    let mut app_state = state
        .lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    
    let _had_session = app_state.current_session_id.is_some();
    
    app_state.current_session_id = None;
    app_state.last_activity_time = None;
    app_state.session_start_time = None;
    app_state.consecutive_high_score_count = 0;
    app_state.sent_break_notification = false;

    #[cfg(debug_assertions)]
    if _had_session {
        println!(
            "{}🧹 Session state cleared (session_id, start_time, last_activity_time reset)",
            get_tracker_prefix()
        );
    }

    Ok(())
}
