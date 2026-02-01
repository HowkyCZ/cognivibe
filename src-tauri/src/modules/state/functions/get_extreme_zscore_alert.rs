use crate::modules::state::types::{AppState, ExtremeZScoreAlert};
use std::sync::Mutex;
use tauri::State;

/// Tauri command to get the current extreme Z-score alert
/// Returns None if no alert exists or if it has expired (older than 5 minutes)
#[tauri::command]
pub fn get_extreme_zscore_alert(
    state: State<Mutex<AppState>>,
) -> Option<ExtremeZScoreAlert> {
    let app_state = state.lock().ok()?;
    
    // Check if alert exists
    let alert = app_state.extreme_zscore_alert.clone()?;
    
    // Check if alert has expired (5 minutes = 300 seconds)
    if let Some(alert_time) = app_state.extreme_zscore_alert_time {
        const ALERT_TIMEOUT_SECS: u64 = 5 * 60; // 5 minutes
        if alert_time.elapsed().as_secs() >= ALERT_TIMEOUT_SECS {
            // Alert has expired, return None
            // Note: We don't clear it here to avoid holding the lock too long
            // The clear_extreme_zscore_alert command should be called separately
            return None;
        }
    }
    
    Some(alert)
}
