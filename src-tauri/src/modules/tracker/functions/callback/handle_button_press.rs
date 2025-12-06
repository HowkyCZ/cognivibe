use rdev::Button;

use super::shared_utils::modify_state;

/// Handle mouse button press events
pub fn handle_button_press(button: Button) {
    modify_state(|state| {
        // Track left and right clicks separately
        match button {
            Button::Left => {
                state.mouse_data.left_clicks += 1;
            }
            Button::Right => {
                state.mouse_data.right_clicks += 1;
            }
            _ => {
                state.mouse_data.other_clicks += 1;
            }
        }
    });
}
