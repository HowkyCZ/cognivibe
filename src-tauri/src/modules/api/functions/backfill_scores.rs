use crate::modules::state::functions::get_user_session::get_user_session;
use crate::modules::state::AppState;
use crate::modules::utils::get_api_base_url;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{command, State};
use tauri_plugin_http::reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackfillScoresResponse {
    pub success: bool,
    pub message: String,
    pub user_id: String,
    pub date: String,
    #[serde(default)]
    pub total_intervals: Option<i64>,
    pub gaps_found: i64,
    pub gaps_filled: i64,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct BackfillRequest {
    user_id: String,
    date: String,
}

#[command]
pub async fn backfill_scores_cmd(
    date: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<BackfillScoresResponse, String> {
    // Get user session
    let session_data = get_user_session(state.clone())?;

    let (user_id, jwt_token) = if let Some(s) = session_data {
        (s.user_id, s.access_token)
    } else {
        return Err("No user session found. Please login first.".to_string());
    };

    // Get API base URL
    let api_base_url = get_api_base_url()?;
    let url = format!("{}/api/scores/backfill", api_base_url.trim_end_matches('/'));

    let client = reqwest::Client::new();
    
    let request_body = BackfillRequest {
        user_id: user_id.clone(),
        date: date.clone(),
    };

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", jwt_token))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send backfill request: {}", e))?;

    let status = response.status();

    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Backfill request failed with status {}: {}",
            status, error_text
        ));
    }

    // Parse the response body as JSON
    let api_response: BackfillScoresResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse backfill response as JSON: {}", e))?;

    #[cfg(debug_assertions)]
    println!(
        "[BACKFILL] ✅ Backfill completed for {}: {} gaps found, {} filled",
        date, api_response.gaps_found, api_response.gaps_filled
    );

    Ok(api_response)
}
