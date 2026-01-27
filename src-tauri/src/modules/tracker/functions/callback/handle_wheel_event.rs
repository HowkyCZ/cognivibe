use super::shared_utils::modify_state;
use std::time::Instant;

/// Handle mouse wheel events with debounce gating
/// Events within 200ms are counted as a single scroll event
pub fn handle_wheel_event(delta_x: i64, delta_y: i64) {
    modify_state(|state| {
        let now = Instant::now();
        let debounce_window_ms = 200; // 200ms debounce window
        
        // Check if this event should be counted (debounce logic)
        let should_count = match state.last_scroll_event_time {
            Some(last_time) => {
                // Count if enough time has passed since last event
                now.duration_since(last_time).as_millis() >= debounce_window_ms as u128
            }
            None => {
                // First event, always count
                true
            }
        };

        if should_count {
            // Increment scroll events counter
            state.mouse_data.wheel_scroll_events += 1;
            state.last_scroll_event_time = Some(now);
        }
        // If debounced, ignore this event (don't update timestamp)

        // Keep wheel_scroll_distance for backward compatibility
        // Apply resolution multiplier if available (same as mouse move distance)
        let total_wheel_delta = (delta_x.abs() + delta_y.abs()) as f64;
        let normalized_wheel_delta = if let Some(multiplier) = state.screen_resolution_multiplier {
            total_wheel_delta * multiplier
        } else {
            total_wheel_delta
        };
        state.mouse_data.wheel_scroll_distance += normalized_wheel_delta;
    });
}
