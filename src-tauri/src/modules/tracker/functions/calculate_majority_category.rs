use crate::modules::state::CategoryChangeEvent;
use std::collections::HashMap;
use std::time::{Duration, Instant};

/// Calculates the majority category for a given minute based on category change events
/// Returns the category that was active for >= 30 seconds, or falls back to other rules
pub fn calculate_majority_category_for_minute(
    events: &[CategoryChangeEvent],
    minute_start: Instant,
    minute_end: Instant,
    current_category: Option<&String>,
) -> String {
    // If no events and we have a current category, carry it forward
    if events.is_empty() {
        return current_category
            .cloned()
            .unwrap_or_else(|| "Other".to_string());
    }

    // Filter events that occurred during this minute
    let mut minute_events: Vec<&CategoryChangeEvent> = events
        .iter()
        .filter(|e| e.timestamp >= minute_start && e.timestamp <= minute_end)
        .collect();

    // If no events in this minute, use the category active at minute start
    if minute_events.is_empty() {
        // Check if there's a category from before this minute
        if let Some(last_event_before) = events.iter().rfind(|e| e.timestamp < minute_start) {
            return last_event_before.category.clone();
        }
        return current_category
            .cloned()
            .unwrap_or_else(|| "Other".to_string());
    }

    // Calculate time spent in each category during this minute
    let mut category_durations: HashMap<String, Duration> = HashMap::new();

    // Start with the category active at minute start
    let start_category = if let Some(last_event_before) = events.iter().rfind(|e| e.timestamp < minute_start) {
        last_event_before.category.clone()
    } else {
        current_category
            .cloned()
            .unwrap_or_else(|| "Other".to_string())
    };

    // Track current category and when it started
    let mut current_cat = start_category.clone();
    let mut current_start = minute_start;

    // Process events in chronological order
    minute_events.sort_by_key(|e| e.timestamp);

    for event in &minute_events {
        // Add duration for the category that was active before this event
        let duration = event.timestamp.duration_since(current_start);
        *category_durations.entry(current_cat.clone()).or_insert(Duration::ZERO) += duration;

        // Update current category and start time
        current_cat = event.category.clone();
        current_start = event.timestamp;
    }

    // Add duration for the final category (from last event to end of minute)
    let final_duration = minute_end.duration_since(current_start);
    *category_durations.entry(current_cat.clone()).or_insert(Duration::ZERO) += final_duration;

    // Find category with >= 30 seconds
    let thirty_seconds = Duration::from_secs(30);
    for (category, duration) in &category_durations {
        if *duration >= thirty_seconds {
            return category.clone();
        }
    }

    // No category has >= 30 seconds, use the one with most time
    if let Some((category, _)) = category_durations
        .iter()
        .max_by_key(|(_, duration)| *duration)
    {
        return category.clone();
    }

    // Fallback: use the first category that appears in the minute
    if let Some(first_event) = minute_events.first() {
        return first_event.category.clone();
    }

    // Final fallback
    "Other".to_string()
}
