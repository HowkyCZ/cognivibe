use crate::modules::api::types::{
    BatchScoresApiResponse, BatchScoresRequest, BatchScoresResponse, DateRange, MissingDataPoint,
};
use crate::modules::state::functions::get_user_session::get_user_session;
use crate::modules::state::AppState;
use crate::modules::utils::get_api_base_url;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde_json::{json, Value};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashSet;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;
use tauri::{command, State};
use tauri_plugin_http::reqwest;
use std::env;

#[command]
pub async fn fetch_batch_scores_cmd(
    start_date: String,
    end_date: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<BatchScoresResponse, String> {
    let use_mock_data = env_truthy("COGNIVIBE_USE_MOCK_DATA") || env_truthy("VITE_USE_MOCK_DATA");

    // In mock mode, allow the dashboard to render even if the user isn't logged in yet.
    let session_data = match get_user_session(state.clone()) {
        Ok(session_opt) => session_opt,
        Err(e) if use_mock_data => {
            #[cfg(debug_assertions)]
            eprintln!("fetch_batch_scores_cmd: ignoring session error in mock mode: {e}");
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
        let data = generate_mock_scores(&start_date, &end_date, &user_id)?;
        let response_body = BatchScoresResponse {
            success: true,
            message: "Mock dashboard data (local)".to_string(),
            user_id,
            date_range: DateRange {
                start: start_date,
                end: end_date,
            },
            data,
            missing_data: Vec::new(),
        };
        return Ok(response_body);
    }

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

fn env_truthy(name: &str) -> bool {
    match env::var(name) {
        Ok(v) => matches!(
            v.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "y" | "on"
        ),
        Err(_) => false,
    }
}

fn clamp_0_100(v: f64) -> f64 {
    if v.is_nan() {
        return 0.0;
    }
    v.max(0.0).min(100.0)
}

fn hash_unit(seed: &str) -> f64 {
    let mut hasher = DefaultHasher::new();
    seed.hash(&mut hasher);
    let x = hasher.finish();
    (x as f64) / (u64::MAX as f64)
}

fn generate_mock_scores(start_date: &str, end_date: &str, user_seed: &str) -> Result<Value, String> {
    let start = NaiveDate::parse_from_str(start_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid start_date format: {}", e))?;
    let end = NaiveDate::parse_from_str(end_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid end_date format: {}", e))?;

    let mut points: Vec<Value> = Vec::new();
    let mut current_date = start;

    // Simulate a “realistic” workday: 10:00–19:00 UTC with a few gaps and jitter.
    let user_phase = hash_unit(user_seed) * std::f64::consts::PI * 2.0;
    let mut rw_focus = ((hash_unit(&format!("{user_seed}:rw_focus")) * 2.0) - 1.0) * 2.0;
    let mut rw_frus = ((hash_unit(&format!("{user_seed}:rw_frus")) * 2.0) - 1.0) * 2.0;
    let mut rw_press = ((hash_unit(&format!("{user_seed}:rw_press")) * 2.0) - 1.0) * 2.0;

    while current_date <= end {
        let day_seed = current_date.format("%Y-%m-%d").to_string();

        // Fixed gaps (minutes since midnight UTC)
        let fixed_gaps: &[(i32, i32)] = &[
            (12 * 60 + 15, 12 * 60 + 55),
            (14 * 60 + 40, 15 * 60 + 10),
            (16 * 60 + 20, 16 * 60 + 35),
        ];

        // Deterministic “random” gaps per day
        let gaps_count = if hash_unit(&format!("{user_seed}:{day_seed}:gaps_count")) > 0.35 { 2 } else { 1 };
        let mut random_gaps: Vec<(i32, i32)> = Vec::new();
        for i in 0..gaps_count {
            let start_window = 10 * 60 + 20;
            let end_window = 18 * 60;
            let span = (end_window - start_window) as f64;
            let r = hash_unit(&format!("{user_seed}:{day_seed}:g{i}"));
            let start_min = start_window + (((r * span) as i32) / 5) * 5;
            let d = hash_unit(&format!("{user_seed}:{day_seed}:g{i}d"));
            let duration_min = 10 + (((d * 25.0) as i32) / 5) * 5; // 10..35
            random_gaps.push((start_min, start_min + duration_min));
        }

        let in_gap = |minute_of_day: i32| -> bool {
            for (s, e) in fixed_gaps {
                if minute_of_day >= *s && minute_of_day < *e { return true; }
            }
            for (s, e) in &random_gaps {
                if minute_of_day >= *s && minute_of_day < *e { return true; }
            }
            false
        };

        // 5-minute intervals, workday only (10:00–19:00)
        for minute_of_day in (10 * 60..=19 * 60).step_by(5) {
            if in_gap(minute_of_day as i32) {
                continue;
            }

            let hour = minute_of_day / 60;
            let minute = minute_of_day % 60;

            let time = NaiveTime::from_hms_opt(hour as u32, minute as u32, 0)
                .ok_or_else(|| "Invalid time".to_string())?;
            let datetime = NaiveDateTime::new(current_date, time);
            let timestamp = datetime.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

            // Normalize within work window for day-shape (0..1)
            let mins_since_start = (minute_of_day - 10 * 60) as f64;
            let work_mins = (19 * 60 - 10 * 60) as f64;
            let u = if work_mins > 0.0 { mins_since_start / work_mins } else { 0.0 };
            let phase = u * std::f64::consts::PI * 2.0;

            let drift = |tag: &str| -> f64 {
                ((hash_unit(&format!("{user_seed}:{day_seed}:{timestamp}:{tag}")) * 2.0) - 1.0)
            };

            rw_focus = rw_focus * 0.86 + drift("df") * 0.75;
            rw_frus = rw_frus * 0.83 + drift("dr") * 0.9;
            rw_press = rw_press * 0.85 + drift("dp") * 0.8;

            let spike_r = hash_unit(&format!("{user_seed}:{day_seed}:{timestamp}:spike"));
            let spike = if spike_r > 0.992 {
                (((hash_unit(&format!("{user_seed}:{day_seed}:{timestamp}:spike2")) * 2.0) - 1.0) * 18.0)
            } else {
                0.0
            };

            let base_focus = 74.0 + 8.0 * (phase * 1.1 + user_phase).sin() - 10.0 * (u - 0.65).max(0.0);
            let base_frus = 32.0 + 10.0 * (phase * 1.7 + user_phase + 1.1).sin() + 14.0 * (u - 0.55).max(0.0);
            let base_press = 40.0 + 12.0 * (phase * 0.9 + user_phase + 2.2).sin() + 16.0 * (u - 0.5).max(0.0);

            let score_concentration = clamp_0_100(base_focus + rw_focus * 6.0 + spike * 0.25);
            let score_frustration = clamp_0_100(base_frus + rw_frus * 8.0 + spike * 0.7);
            let score_pressure = clamp_0_100(base_press + rw_press * 7.0 + spike * 0.35);

            let score_total = clamp_0_100(
                0.42 * score_frustration + 0.42 * score_pressure + 0.16 * (100.0 - score_concentration),
            );

            points.push(json!({
                "timestamp": timestamp,
                "score_total": score_total,
                "score_frustration": score_frustration,
                "score_pressure": score_pressure,
                "score_concentration": score_concentration,
            }));
        }

        current_date = current_date
            .succ_opt()
            .ok_or_else(|| "Failed to increment date".to_string())?;
    }

    Ok(Value::Array(points))
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
