use crate::modules::api::types::{BatchScoresRequest, BatchScoresResponse, BatchScoresApiResponse, MissingDataPoint};
use crate::modules::state::functions::get_user_session::get_user_session;
use crate::modules::state::AppState;
use crate::modules::utils::get_api_base_url;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde_json::Value;
use std::collections::HashSet;
use std::sync::Mutex;
use tauri::{command, State};
use tauri_plugin_http::reqwest;

#[command]
pub async fn fetch_batch_scores_cmd(
    start_date: String,
    end_date: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<BatchScoresResponse, String> {
    // Get user session using the helper function
    let session_data = get_user_session(state.clone())?
        .ok_or_else(|| "No user session found. Please login first.".to_string())?;

    let user_id = session_data.user_id;
    let jwt_token = session_data.access_token;

    // Get API base URL using the helper function
    let api_base_url = get_api_base_url()?;

    let request_body = BatchScoresRequest {
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        user_id: user_id.clone(),
    };

    let url = format!("{}/api/scores/batch", api_base_url.trim_end_matches('/'));

    let client = reqwest::Client::new();

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", jwt_token))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    let status = response.status();

    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Request failed with status {}: {}",
            status, error_text
        ));
    }

    // Parse the response body as JSON (without missing_data field)
    let api_response: BatchScoresApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response as JSON: {}", e))?;

    // Generate missing data points
    let missing_data = generate_missing_intervals(&start_date, &end_date, &api_response.data)?;
    
    // Build the final response with missing_data
    let response_body = BatchScoresResponse {
        success: api_response.success,
        message: api_response.message,
        user_id: api_response.user_id,
        date_range: api_response.date_range,
        data: api_response.data,
        missing_data,
    };

    Ok(response_body)
}

/// Generate missing 5-minute intervals for the given date range
fn generate_missing_intervals(
    start_date: &str,
    end_date: &str,
    data: &Value,
) -> Result<Vec<MissingDataPoint>, String> {
    // Parse start and end dates
    let start = NaiveDate::parse_from_str(start_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid start_date format: {}", e))?;
    let end = NaiveDate::parse_from_str(end_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid end_date format: {}", e))?;

    // Extract existing timestamps from the data
    let mut existing_timestamps = HashSet::new();
    if let Some(data_array) = data.as_array() {
        for item in data_array {
            if let Some(timestamp) = item.get("timestamp").and_then(|t| t.as_str()) {
                existing_timestamps.insert(timestamp.to_string());
            }
        }
    }

    // Generate all 5-minute intervals for the date range
    let mut missing_intervals = Vec::new();
    let mut current_date = start;

    while current_date <= end {
        // Generate timestamps for each 5-minute interval in the day (00:00 to 23:55)
        for hour in 0..24 {
            for minute in (0..60).step_by(5) {
                let time = NaiveTime::from_hms_opt(hour, minute, 0)
                    .ok_or_else(|| "Invalid time".to_string())?;
                let datetime = NaiveDateTime::new(current_date, time);
                let timestamp = datetime.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

                // Check if this timestamp exists in the data
                if !existing_timestamps.contains(&timestamp) {
                    missing_intervals.push(MissingDataPoint {
                        timestamp,
                        score_total: None,
                        score_focus: None,
                        score_strain: None,
                        score_energy: None,
                    });
                }
            }
        }

        // Move to next day
        current_date = current_date
            .succ_opt()
            .ok_or_else(|| "Failed to increment date".to_string())?;
    }

    Ok(missing_intervals)
}
