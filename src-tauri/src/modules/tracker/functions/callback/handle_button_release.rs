use rdev::Button;

use super::super::log_active_window::log_active_window;

/// Handle mouse button release events
pub fn handle_button_release(button: Button) {
    // Log active window on left button release to track window focus changes
    if matches!(button, Button::Left) {
        log_active_window();

        #[cfg(debug_assertions)]
        println!("🖱️ Left button released - checking active window");
    }
}
