use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use tauri_plugin_http::reqwest;

use crate::modules::state::{get_user_session, AppState};
use crate::modules::utils::get_api_base_url;

/// Data structure for uploading tracking logs to the server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogData {
    pub mouse_left_clicks_count: u32,
    pub mouse_right_clicks_count: u32,
    pub mouse_other_clicks_count: u32,
    pub minute_timestamp: String,
    pub user_id: String,
    pub keyboard_key_downs_count: u32,
    pub keyboard_key_ups_count: u32,
    pub mouse_move_distance: f64,
    pub mouse_scroll_distance: f64,
    pub window_change_count: u32,
    pub backspace_count: u32,
    pub active_event_count: u32,
    pub screen_resolution_multiplier: Option<f64>,
    pub wheel_scroll_events_count: u32,
    pub app_category: Option<String>,
    pub session_id: Option<String>,
}

/// Upload tracking data to the server
///
/// This function sends the accumulated tracking data to the backend server
/// for storage and analysis. It requires an active user session for authentication.
pub async fn upload_tracking_data(
    state: State<'_, Mutex<AppState>>,
    log_data: LogData,
) -> Result<(), String> {
    #[cfg(debug_assertions)]
    println!("[UPLOAD_DATA] 📤 Uploading tracking data for minute: {}", log_data.minute_timestamp);
    
    // Get the current user session from app state
    let session = match get_user_session(state) {
        Ok(s) => s,
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[UPLOAD_DATA] ❌ Failed to get user session: {}", e);
            return Err(e);
        }
    };
    
    let session_data = match session {
        Some(s) => {
            #[cfg(debug_assertions)]
            println!("[UPLOAD_DATA] ✅ User session found");
            s
        }
        None => {
            #[cfg(debug_assertions)]
            eprintln!("[UPLOAD_DATA] ❌ No active user session");
            return Err("No active user session. Please log in.".to_string());
        }
    };

    // Get server URL using the helper function
    let server_url = match get_api_base_url() {
        Ok(url) => {
            #[cfg(debug_assertions)]
            println!("[UPLOAD_DATA] ✅ API base URL retrieved");
            url
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[UPLOAD_DATA] ❌ Failed to get API base URL: {}", e);
            return Err(format!("Failed to get API base URL: {}", e));
        }
    };
    
    let upload_url = format!("{}/api/uploadLog", server_url);
    #[cfg(debug_assertions)]
    println!("[UPLOAD_DATA] POST URL: {}", upload_url);

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    #[cfg(debug_assertions)]
    println!("[UPLOAD_DATA] Sending POST request with {} events...", log_data.active_event_count);
    
    let response = match client
        .post(&upload_url)
        .bearer_auth(&session_data.access_token)
        .json(&log_data)
        .send()
        .await
    {
        Ok(resp) => {
            #[cfg(debug_assertions)]
            println!("[UPLOAD_DATA] ✅ Request sent successfully, status: {}", resp.status());
            resp
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[UPLOAD_DATA] ❌ HTTP request failed: {}", e);
            return Err(format!("HTTP request failed: {}", e));
        }
    };

    // Check response status
    let status = response.status();
    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        #[cfg(debug_assertions)]
        eprintln!("[UPLOAD_DATA] ❌ Server returned error {}: {}", status, error_text);
        return Err(format!("Server returned error {}: {}", status, error_text));
    }

    #[cfg(debug_assertions)]
    println!("[UPLOAD_DATA] ✅ Tracking data uploaded successfully");

    Ok(())
}
