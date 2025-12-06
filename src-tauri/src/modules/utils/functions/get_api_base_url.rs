use std::env;

/// Get the API base URL from the VITE_SERVER_URL environment variable
/// Returns the base URL for making API requests to the server
pub fn get_api_base_url() -> Result<String, String> {
    env::var("VITE_SERVER_URL")
        .map_err(|_| "VITE_SERVER_URL environment variable not set".to_string())
}
