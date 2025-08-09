use rdev::{Event, EventType};

use super::handle_key_press::handle_key_press;
use super::handle_key_release::handle_key_release;
use super::{handle_button_press, handle_button_release, handle_mouse_move, handle_wheel_event};

/// Callback function that processes input events (mouse and keyboard) from the system.
///
/// This function is called by the rdev library for every input event when tracking is active.
/// It only tracks events when measuring is enabled and updates the global app state.
pub fn input_callback(event: Event) {
    // Only proceed with any tracking if measuring is active
    if !super::super::get_is_measuring::get_is_measuring() {
        return;
    }

    match event.event_type {
        EventType::KeyPress(key) => handle_key_press(key),
        EventType::KeyRelease(key) => handle_key_release(key),
        EventType::ButtonPress(button) => handle_button_press(button),
        // Note: ButtonRelease is only used to check/log the active window after a click.
        // Click metrics are recorded on ButtonPress.
        EventType::ButtonRelease(button) => handle_button_release(button),
        EventType::MouseMove { x, y } => handle_mouse_move(x as f64, y as f64),
        EventType::Wheel { delta_x, delta_y } => handle_wheel_event(delta_x, delta_y),
    }
}
