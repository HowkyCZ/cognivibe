use crate::modules::state::types::AppState;
use std::sync::Mutex;
use tauri::State;

/// Tauri command to clear the current extreme Z-score alert
/// Called after user submits the survey or when the alert expires
#[tauri::command]
pub fn clear_extreme_zscore_alert(state: State<Mutex<AppState>>) {
    if let Ok(mut app_state) = state.lock() {
        app_state.extreme_zscore_alert = None;
        app_state.extreme_zscore_alert_time = None;
        
        #[cfg(debug_assertions)]
        println!("[CLEAR_ZSCORE_ALERT] ✅ Extreme Z-score alert cleared");
    }
}
