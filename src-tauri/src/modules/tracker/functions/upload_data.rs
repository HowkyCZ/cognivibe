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
    pub app_switch_count: u32,
}

/// Upload tracking data to the server
///
/// This function sends the accumulated tracking data to the backend server
/// for storage and analysis. It requires an active user session for authentication.
pub async fn upload_tracking_data(
    state: State<'_, Mutex<AppState>>,
    log_data: LogData,
) -> Result<(), String> {
    // Get the current user session from app state
    let session = get_user_session(state)?;
    let session_data = session.ok_or("No active user session. Please log in.")?;

    // Get server URL using the helper function
    let server_url = get_api_base_url()?;
    let upload_url = format!("{}/api/uploadLog", server_url);

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    let response = client
        .post(&upload_url)
        .bearer_auth(&session_data.access_token)
        .json(&log_data)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    // Check response status
    let status = response.status();
    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Server returned error {}: {}", status, error_text));
    }

    Ok(())
}
