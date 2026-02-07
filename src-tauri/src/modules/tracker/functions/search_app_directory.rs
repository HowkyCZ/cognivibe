use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest;

use crate::modules::state::AppState;
use crate::modules::utils::get_api_base_url;

/// Response structure from the app directory search API
#[derive(Debug, Clone, Serialize, Deserialize)]
struct SearchResponse {
    success: bool,
    category: Option<String>,
    #[serde(default)]
    message: Option<String>,
}

/// Request structure for the app directory search API
#[derive(Debug, Clone, Serialize, Deserialize)]
struct SearchRequest {
    app_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    domain: Option<String>,
    /// When true, indicates the app is a browser (Chrome, Firefox, etc.)
    /// so the server can prioritize domain-based matches over app name matches.
    #[serde(default)]
    is_browser: bool,
}

/// Parses domain from Brandfetch icon URL
/// Example: https://cdn.brandfetch.io/domain/teams.microsoft.com?c=... -> teams.microsoft.com
#[allow(dead_code)]
pub fn parse_domain_from_icon_url(icon_url: &str) -> Option<String> {
    use url::Url;
    if let Ok(url) = Url::parse(icon_url) {
        let path_parts: Vec<&str> = url.path().split('/').collect();
        if let Some(domain_index) = path_parts.iter().position(|&p| p == "domain") {
            if domain_index + 1 < path_parts.len() {
                return Some(path_parts[domain_index + 1].to_string());
            }
        }
    }
    None
}

/// Extracts domain from browser window title
/// Attempts to parse common patterns like "GitHub - Your Repository" or "example.com - Page Title"
pub fn extract_domain_from_browser_title(title: &str) -> Option<String> {
    // Common patterns:
    // 1. "Domain - Title" format
    // 2. "Title | Domain" format
    // 3. URLs in title
    
    // Try to find domain-like patterns (contains dots, no spaces before first dot)
    let parts: Vec<&str> = title.split(" - ").collect();
    if let Some(first_part) = parts.first() {
        let trimmed = first_part.trim();
        if trimmed.contains('.') && !trimmed.contains(' ') {
            // Check if it looks like a domain
            if trimmed.matches('.').count() >= 1 {
                return Some(trimmed.to_string());
            }
        }
    }
    
    // Try "Title | Domain" format
    let parts: Vec<&str> = title.split(" | ").collect();
    if let Some(last_part) = parts.last() {
        let trimmed = last_part.trim();
        if trimmed.contains('.') && !trimmed.contains(' ') {
            if trimmed.matches('.').count() >= 1 {
                return Some(trimmed.to_string());
            }
        }
    }
    
    None
}

/// Extracts domain (host) from a full URL
/// Example: "https://github.com/user/repo" -> "github.com"
pub fn extract_domain_from_url(url_str: &str) -> Option<String> {
    use url::Url;
    Url::parse(url_str)
        .ok()
        .and_then(|url| url.host_str().map(|h| h.to_string()))
}

/// Searches the app directory for a matching app/site and returns its category
/// Returns None if not found, or the category string if found
///
/// When `is_browser` is true, the server will prioritize domain-based matches
/// over the browser app name match (e.g., "github.com" -> Development instead of
/// "Google Chrome" -> Browsing and Research).
pub async fn search_app_directory(
    app_handle: &AppHandle,
    app_name: &str,
    domain: Option<&str>,
    is_browser: bool,
) -> Result<Option<String>, String> {
    // Get the current user session from app state
    let state = app_handle.state::<Mutex<AppState>>();
    let access_token = {
        let app_state = state.lock().map_err(|e| format!("Failed to lock app state: {}", e))?;
        let session_data = app_state
            .session_data
            .as_ref()
            .ok_or("No active user session. Please log in.")?;
        session_data.access_token.clone()
    }; // MutexGuard is dropped here

    // Get server URL using the helper function
    let server_url = get_api_base_url()?;
    let search_url = format!("{}/api/searchAppDirectory", server_url);

    // Prepare request body
    let request_body = SearchRequest {
        app_name: app_name.to_string(),
        domain: domain.map(|d| d.to_string()),
        is_browser,
    };

    // Create the HTTP client and send request
    let client = reqwest::Client::new();
    let response = client
        .post(&search_url)
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
    let search_response: SearchResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if search_response.success {
        Ok(search_response.category)
    } else {
        // If search failed, return None (will default to "Other")
        Ok(None)
    }
}
