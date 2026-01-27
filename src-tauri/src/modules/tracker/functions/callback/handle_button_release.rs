use rdev::Button;

use super::super::log_active_window::log_active_window_async;

/// Handle mouse button release events
pub fn handle_button_release(button: Button) {
    // Log active window on left button release to track window focus changes
    // The function now runs asynchronously by default to avoid blocking the input callback thread
    if matches!(button, Button::Left) {
        log_active_window_async();
    }
}
