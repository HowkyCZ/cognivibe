/// Get the API base URL
/// Returns the base URL for making API requests to the server
/// The URL is embedded at compile time from the VITE_SERVER_URL environment variable
pub fn get_api_base_url() -> Result<String, String> {
    // Use compile-time environment variable
    const SERVER_URL: Option<&str> = option_env!("VITE_SERVER_URL");
    
    SERVER_URL
        .map(|s| s.to_string())
        .ok_or_else(|| "VITE_SERVER_URL environment variable not set at compile time".to_string())
}
