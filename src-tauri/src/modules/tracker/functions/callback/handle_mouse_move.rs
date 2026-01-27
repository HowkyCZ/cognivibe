use super::shared_utils::modify_state;

/// Handle mouse movement events
pub fn handle_mouse_move(x: f64, y: f64) {
    modify_state(|state| {
        let mouse_data = &mut state.mouse_data;

        // Increment move events counter (for active_sd calculation)
        mouse_data.move_events += 1;

        // Calculate distance if we have a previous position
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

        // Update last position
        mouse_data.last_x = x;
        mouse_data.last_y = y;
    });
}
