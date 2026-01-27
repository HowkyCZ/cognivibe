use std::sync::Mutex;
use tauri::State;

use crate::modules::state::{AppState, SessionData};
#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;

/// Set the user session data in the application state
/// Receives session data from Supabase and stores it in AppState
#[tauri::command]
pub fn set_user_session(state: State<Mutex<AppState>>, session: SessionData) -> Result<(), String> {
    // Acquire lock on the global app state and update session data
    let mut app_state = state
        .lock()
        .map_err(|e| format!("Failed to lock app state: {}", e))?;
    
    let user_id = session.user_id.clone();
    app_state.session_data = Some(session.clone());

    #[cfg(debug_assertions)]
    println!(
        "{}🔐 User session set for user_id: {}",
        get_tracker_prefix(),
        user_id
    );

    Ok(())
}
