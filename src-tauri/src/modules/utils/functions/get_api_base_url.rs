use std::env;

/// Get the API base URL
/// Returns the base URL for making API requests to the server
/// Prefers runtime environment variables but falls back to compile-time embedding
pub fn get_api_base_url() -> Result<String, String> {
    // In dev, prefer the explicit dev server URL (it avoids mixing local Supabase auth
    // with the production server by accident).
    #[cfg(debug_assertions)]
    {
        if let Ok(v) = env::var("VITE_DEVELOPMENT_SERVER_URL") {
            let trimmed = v.trim().to_string();
            if !trimmed.is_empty() {
                return Ok(trimmed);
            }
        }
        if let Some(v) = option_env!("VITE_DEVELOPMENT_SERVER_URL") {
            let trimmed = v.trim().to_string();
            if !trimmed.is_empty() {
                return Ok(trimmed);
            }
        }
    }

    // Prefer runtime env so updates don't require a rebuild; fall back to compile-time embed.
    env::var("VITE_SERVER_URL").or_else(|_| {
        option_env!("VITE_SERVER_URL")
            .map(String::from)
            .ok_or_else(|| "VITE_SERVER_URL environment variable not set".to_string())
    })
}
