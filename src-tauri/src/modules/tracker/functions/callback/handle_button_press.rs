use rdev::Button;

use super::shared_utils::modify_state;

/// Handle mouse button press events
pub fn handle_button_press(button: Button) {
    modify_state(|state| {
        // Track left and right clicks separately
        match button {
            Button::Left => {
                state.mouse_data.left_clicks += 1;
                #[cfg(debug_assertions)]
                println!("🖱️ Left click detected");
            }
            Button::Right => {
                state.mouse_data.right_clicks += 1;
                #[cfg(debug_assertions)]
                println!("🖱️ Right click detected");
            }
            _ => {
                state.mouse_data.other_clicks += 1;
                #[cfg(debug_assertions)]
                println!("🖱️ Other button click detected: {:?}", button);
            }
        }
    });
}
