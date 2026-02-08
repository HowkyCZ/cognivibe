use std::sync::Mutex;
use std::time::SystemTime;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::modules::state::AppState;

/// 30 minutes in seconds
const SESSION_30_MINUTES_SECS: u64 = 30 * 60;

/// 20 minutes in seconds
const SESSION_20_MINUTES_SECS: u64 = 20 * 60;

/// Number of consecutive inactive minutes to trigger notification
const INACTIVE_MINUTES_THRESHOLD: u32 = 4;

/// Check and send session duration notifications
/// 
/// This function handles two types of notifications:
/// 1. 30% chance when session reaches exactly 30 minutes
/// 2. 70% chance when session >= 20 min AND 4 consecutive inactive minutes
/// Note: Break reminders are now handled by the intervention system (check_interventions.rs)
pub fn check_session_notifications(
    app_handle: &AppHandle,
    session_duration_secs: u64,
    is_active_minute: bool,
) {
    let state = app_handle.state::<Mutex<AppState>>();
    
    let (should_check_30min, should_check_inactivity, session_minutes) = {
        let mut app_state = match state.lock() {
            Ok(s) => s,
            Err(_) => return,
        };
        
        // Update consecutive inactive minutes counter
        if is_active_minute {
            app_state.consecutive_inactive_minutes = 0;
        } else {
            app_state.consecutive_inactive_minutes += 1;
        }
        
        let should_check_30min = !app_state.sent_30min_notification 
            && session_duration_secs >= SESSION_30_MINUTES_SECS
            && session_duration_secs < SESSION_30_MINUTES_SECS + 60; // Within the 30th minute
        
        let should_check_inactivity = session_duration_secs >= SESSION_20_MINUTES_SECS
            && app_state.consecutive_inactive_minutes >= INACTIVE_MINUTES_THRESHOLD;
        
        let session_minutes = (session_duration_secs / 60) as u32;
        
        // Mark 30-min notification as sent to prevent duplicates
        if should_check_30min && rand_chance(0.30) {
            app_state.sent_30min_notification = true;
            (true, should_check_inactivity, session_minutes)
        } else if should_check_30min {
            // Didn't win the 30% chance, but still mark as "checked"
            app_state.sent_30min_notification = true;
            (false, should_check_inactivity, session_minutes)
        } else {
            (false, should_check_inactivity, session_minutes)
        }
    };
    
    // Send 30-minute notification (30% chance already checked above)
    if should_check_30min {
        #[cfg(debug_assertions)]
        println!("[SESSION_NOTIFY] 📬 Sending 30-minute session notification");
        
        if let Err(e) = app_handle
            .notification()
            .builder()
            .title("Cognivibe")
            .body("Fill out an assessment about your cognitive work in the last 30 minutes.")
            .show()
        {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_NOTIFY] Failed to send 30-min notification: {}", e);
        }
    }
    
    // Send inactivity notification (70% chance)
    if should_check_inactivity && rand_chance(0.70) {
        #[cfg(debug_assertions)]
        println!("[SESSION_NOTIFY] 📬 Sending inactivity notification (session: {} min)", session_minutes);
        
        let body = format!(
            "Fill out an assessment about your cognitive work in the last {} minutes.",
            session_minutes
        );
        
        if let Err(e) = app_handle
            .notification()
            .builder()
            .title("Cognivibe")
            .body(&body)
            .show()
        {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_NOTIFY] Failed to send inactivity notification: {}", e);
        }
        
        // Reset consecutive inactive counter to prevent spam
        if let Ok(mut app_state) = state.lock() {
            app_state.consecutive_inactive_minutes = 0;
        }
    }

}

/// Generate a random boolean with the given probability
fn rand_chance(probability: f64) -> bool {
    // Simple pseudo-random based on system time nanoseconds
    let nanos = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    
    let rand_value = (nanos as f64) / (u32::MAX as f64);
    rand_value < probability
}
