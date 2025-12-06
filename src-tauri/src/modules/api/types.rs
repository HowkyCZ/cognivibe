use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DateRange {
    pub start: String,
    pub end: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchScoresResponse {
    pub success: bool,
    pub message: String,
    pub user_id: String,
    pub date_range: DateRange,
    pub data: serde_json::Value, // Using Value since we don't know the exact structure of scores data
    pub missing_data: Vec<MissingDataPoint>,
}

// API response without missing_data field (for initial parsing)
#[derive(Debug, Serialize, Deserialize)]
pub struct BatchScoresApiResponse {
    pub success: bool,
    pub message: String,
    pub user_id: String,
    pub date_range: DateRange,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MissingDataPoint {
    pub timestamp: String,
    pub score_total: Option<f64>,
    pub score_focus: Option<f64>,
    pub score_strain: Option<f64>,
    pub score_energy: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchScoresRequest {
    pub start_date: String,
    pub end_date: String,
    pub user_id: String,
}
