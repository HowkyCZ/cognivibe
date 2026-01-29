use crate::modules::api::types::{ProductivityTimeRequest, ProductivityTimeResponse};
use crate::modules::state::functions::get_user_session::get_user_session;
use crate::modules::state::AppState;
use crate::modules::utils::get_api_base_url;
use std::collections::HashMap;
use std::env;
use std::sync::Mutex;
use tauri::{command, State};
use tauri_plugin_http::reqwest;

#[command]
pub async fn fetch_productivity_time_cmd(
    date: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<ProductivityTimeResponse, String> {
    let use_mock_data = env_truthy("COGNIVIBE_USE_MOCK_DATA") || env_truthy("VITE_USE_MOCK_DATA");

    // In mock mode, allow the dashboard to render even if the user isn't logged in yet.
    let session_data = match get_user_session(state.clone()) {
        Ok(session_opt) => session_opt,
        Err(e) if use_mock_data => {
            #[cfg(debug_assertions)]
            eprintln!("fetch_productivity_time_cmd: ignoring session error in mock mode: {e}");
            None
        }
        Err(e) => return Err(e),
    };

    let (user_id, jwt_token) = if let Some(s) = session_data {
        (s.user_id, s.access_token)
    } else if use_mock_data {
        ("local-demo-user".to_string(), String::new())
    } else {
        return Err("No user session found. Please login first.".to_string());
    };

    if use_mock_data {
        let data = generate_mock_productivity_time(&date, &user_id)?;
        let response_body = ProductivityTimeResponse {
            success: true,
            message: "Mock productivity time data (local)".to_string(),
            user_id,
            date: date.clone(),
            data,
        };
        return Ok(response_body);
    }

    // Get API base URL using the helper function
    let api_base_url = get_api_base_url()?;

    let request_body = ProductivityTimeRequest {
        user_id: user_id.clone(),
        date: date.clone(),
    };

    let url = format!("{}/api/productivity-time", api_base_url.trim_end_matches('/'));

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

    // Parse the response body as JSON
    let api_response: ProductivityTimeResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response as JSON: {}", e))?;

    Ok(api_response)
}

fn env_truthy(name: &str) -> bool {
    match env::var(name) {
        Ok(v) => matches!(
            v.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "y" | "on"
        ),
        Err(_) => false,
    }
}

fn generate_mock_productivity_time(
    date: &str,
    user_seed: &str,
) -> Result<HashMap<String, u64>, String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    fn hash_unit(seed: &str) -> f64 {
        let mut hasher = DefaultHasher::new();
        seed.hash(&mut hasher);
        let x = hasher.finish();
        (x as f64) / (u64::MAX as f64)
    }

    let categories = vec![
        "Communication",
        "Meetings",
        "Docs and Writing",
        "Productivity and Planning",
        "Browsing and Research",
        "Development",
        "Design and Creative",
        "Data and Analytics",
        "Media and Entertainment",
        "Other",
    ];

    let mut category_counts: HashMap<String, u64> = HashMap::new();

    // Generate realistic distribution - simulate a workday with ~480 minutes total
    let total_minutes = 480.0;
    let mut remaining: f64 = total_minutes;

    for (i, category) in categories.iter().enumerate() {
        let seed = format!("{user_seed}:{date}:{category}");
        let r = hash_unit(&seed);

        // Different categories get different base distributions
        let base_weights = match *category {
            "Development" => 0.25,      // 25% - most time
            "Communication" => 0.15,   // 15%
            "Meetings" => 0.10,        // 10%
            "Docs and Writing" => 0.12, // 12%
            "Productivity and Planning" => 0.08, // 8%
            "Browsing and Research" => 0.10, // 10%
            "Design and Creative" => 0.05, // 5%
            "Data and Analytics" => 0.05, // 5%
            "Media and Entertainment" => 0.05, // 5%
            "Other" => 0.05,           // 5%
            _ => 0.05,
        };

        // Add some randomness
        let weight = base_weights * (0.8 + r * 0.4); // ±20% variation
        let minutes = if i == categories.len() - 1 {
            // Last category gets remaining time
            remaining.max(0.0) as u64
        } else {
            let allocated = (total_minutes * weight).round() as u64;
            remaining -= allocated as f64;
            allocated
        };

        category_counts.insert(category.to_string(), minutes);
    }

    Ok(category_counts)
}
