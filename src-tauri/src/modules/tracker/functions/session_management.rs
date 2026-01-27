use serde::{Deserialize, Serialize};
use tauri_plugin_http::reqwest;

use crate::modules::utils::get_api_base_url;

/// Response from session creation API
#[derive(Debug, Clone, Serialize, Deserialize)]
struct CreateSessionResponse {
    session_id: String,
    timestamp_start: String,
}

/// Creates a new session on the server
///
/// This function sends a request to the backend to create a new session
/// and returns the session_id for local tracking.
pub async fn create_session(
    user_id: String,
    access_token: String,
) -> Result<String, String> {
    // Get server URL using the helper function
    let server_url = get_api_base_url()?;
    let create_url = format!("{}/api/sessions", server_url);

    // Create request body
    let request_body = serde_json::json!({
        "user_id": user_id
    });

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    let response = client
        .post(&create_url)
        .bearer_auth(&access_token)
        .json(&request_body)
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

    // Parse response
    let session_response: CreateSessionResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(session_response.session_id)
}

/// Ends a session on the server
///
/// This function sends a request to the backend to end the specified session.
/// The server will calculate category_share and cognitive load scores.
pub async fn end_session(
    session_id: String,
    access_token: String,
) -> Result<(), String> {
    // Get server URL using the helper function
    let server_url = get_api_base_url()?;
    let end_url = format!("{}/api/sessions/{}/end", server_url, session_id);

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    let response = client
        .post(&end_url)
        .bearer_auth(&access_token)
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
