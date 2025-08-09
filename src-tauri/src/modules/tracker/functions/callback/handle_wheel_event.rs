use super::shared_utils::modify_state;

/// Handle mouse wheel events
pub fn handle_wheel_event(delta_x: i64, delta_y: i64) {
    #[cfg(debug_assertions)]
    println!(
        "🎡 Wheel event detected! delta_x={}, delta_y={}",
        delta_x, delta_y
    );

    modify_state(|state| {
        // Calculate total scroll distance from both horizontal and vertical scroll
        let total_wheel_delta = (delta_x.abs() + delta_y.abs()) as f64;
        state.mouse_data.wheel_scroll_distance += total_wheel_delta;
    });
}
