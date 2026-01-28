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
    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] 🚀 Creating new session for user_id: {}", user_id);

    // Get server URL using the helper function
    let server_url = match get_api_base_url() {
        Ok(url) => {
            #[cfg(debug_assertions)]
            println!("[SESSION_MGMT] ✅ API base URL retrieved: {}", url);
            url
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_MGMT] ❌ Failed to get API base URL: {}", e);
            return Err(format!("Failed to get API base URL: {}", e));
        }
    };
    
    let create_url = format!("{}/api/sessions", server_url);
    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] POST URL: {}", create_url);

    // Create request body
    let request_body = serde_json::json!({
        "user_id": user_id
    });

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] Sending POST request...");
    
    let response = match client
        .post(&create_url)
        .bearer_auth(&access_token)
        .json(&request_body)
        .send()
        .await
    {
        Ok(resp) => {
            #[cfg(debug_assertions)]
            println!("[SESSION_MGMT] ✅ Request sent successfully, status: {}", resp.status());
            resp
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_MGMT] ❌ HTTP request failed: {}", e);
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
        eprintln!("[SESSION_MGMT] ❌ Server returned error {}: {}", status, error_text);
        return Err(format!("Server returned error {}: {}", status, error_text));
    }

    // Parse response
    let session_response: CreateSessionResponse = match response.json::<CreateSessionResponse>().await {
        Ok(resp) => {
            #[cfg(debug_assertions)]
            println!("[SESSION_MGMT] ✅ Session created successfully: {}", resp.session_id);
            resp
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_MGMT] ❌ Failed to parse response: {}", e);
            return Err(format!("Failed to parse response: {}", e));
        }
    };

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
    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] 🛑 Ending session: {}", session_id);

    // Get server URL using the helper function
    let server_url = match get_api_base_url() {
        Ok(url) => {
            #[cfg(debug_assertions)]
            println!("[SESSION_MGMT] ✅ API base URL retrieved: {}", url);
            url
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_MGMT] ❌ Failed to get API base URL: {}", e);
            return Err(format!("Failed to get API base URL: {}", e));
        }
    };
    
    let end_url = format!("{}/api/sessions/{}/end", server_url, session_id);
    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] POST URL: {}", end_url);

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] Sending POST request to end session...");
    
    let response = match client
        .post(&end_url)
        .bearer_auth(&access_token)
        .send()
        .await
    {
        Ok(resp) => {
            #[cfg(debug_assertions)]
            println!("[SESSION_MGMT] ✅ Request sent successfully, status: {}", resp.status());
            resp
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[SESSION_MGMT] ❌ HTTP request failed: {}", e);
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
        eprintln!("[SESSION_MGMT] ❌ Server returned error {}: {}", status, error_text);
        return Err(format!("Server returned error {}: {}", status, error_text));
    }

    #[cfg(debug_assertions)]
    println!("[SESSION_MGMT] ✅ Session ended successfully");

    Ok(())
}
