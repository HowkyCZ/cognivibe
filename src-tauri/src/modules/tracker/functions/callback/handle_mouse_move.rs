use super::shared_utils::modify_state;
use std::time::Instant;

/// Handle mouse movement events with gating
/// Events within 200ms are counted as a single move event (for active_sd calculation)
/// Distance tracking is always updated regardless of gating
pub fn handle_mouse_move(x: f64, y: f64) {
    modify_state(|state| {
        let mouse_data = &mut state.mouse_data;
        let now = Instant::now();
        let gating_window_ms = 200; // 200ms gating window

        // Check if this event should be counted (gating logic)
        let should_count = match state.last_mouse_move_time {
            Some(last_time) => {
                // Count if enough time has passed since last event
                now.duration_since(last_time).as_millis() >= gating_window_ms as u128
            }
            None => {
                // First event, always count
                true
            }
        };

        if should_count {
            // Increment move events counter (for active_sd calculation)
            mouse_data.move_events += 1;
            state.last_mouse_move_time = Some(now);
        }
        // If gated, ignore this event for counting (don't update timestamp)
        // Distance calculation continues regardless of gating

        // Calculate distance if we have a previous position
        // Always update distance, regardless of gating
        if mouse_data.last_x != 0.0 || mouse_data.last_y != 0.0 {
            let dx = x - mouse_data.last_x;
            let dy = y - mouse_data.last_y;
            let distance = (dx * dx + dy * dy).sqrt();
            
            // Apply resolution multiplier if available
            let normalized_distance = if let Some(multiplier) = state.screen_resolution_multiplier {
                distance * multiplier
            } else {
                distance
            };
            
            mouse_data.total_distance += normalized_distance;
        }

        // Update last position (always, regardless of gating)
        mouse_data.last_x = x;
        mouse_data.last_y = y;
    });
}
