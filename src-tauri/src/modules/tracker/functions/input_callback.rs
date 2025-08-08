use rdev::{Event, EventType};
use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;

/// Global app handle storage for input events using OnceLock for thread safety
pub static INPUT_APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

/// Helper function to check if measuring is currently active
fn is_measuring() -> bool {
    if let Some(app) = INPUT_APP_HANDLE.get() {
        if let Ok(state) = app.state::<Mutex<AppState>>().lock() {
            return state.is_measuring;
        }
    }
    false
}

/// Helper function to safely modify app state
fn modify_state<F>(f: F)
where
    F: FnOnce(&mut AppState),
{
    if let Some(app) = INPUT_APP_HANDLE.get() {
        if let Ok(mut state) = app.state::<Mutex<AppState>>().lock() {
            f(&mut *state);
        }
    }
}

/// Callback function that processes input events (mouse and keyboard) from the system.
///
/// This function is called by the rdev library for every input event when tracking is active.
/// It only tracks events when measuring is enabled and updates the global app state.
pub fn input_callback(event: Event) {
    // Only proceed if measuring is active
    if !is_measuring() {
        return;
    }

    match event.event_type {
        EventType::ButtonPress(button) => {
            modify_state(|state| {
                // Track left and right clicks separately
                match button {
                    rdev::Button::Left => {
                        state.mouse_data.left_clicks += 1;
                        #[cfg(debug_assertions)]
                        println!("🖱️ Left click detected");
                    }
                    rdev::Button::Right => {
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
        EventType::ButtonRelease(_) => {
            // We don't need to track button releases since we're tracking clicks on press
        }
        EventType::MouseMove { x, y } => {
            modify_state(|state| {
                let mouse_data = &mut state.mouse_data;

                // Calculate distance if we have a previous position
                if mouse_data.last_x != 0.0 || mouse_data.last_y != 0.0 {
                    let dx = x as f64 - mouse_data.last_x;
                    let dy = y as f64 - mouse_data.last_y;
                    let distance = (dx * dx + dy * dy).sqrt();
                    mouse_data.total_distance += distance;

                    // Log every 100px of movement to avoid spam
                    #[cfg(debug_assertions)]
                    if (mouse_data.total_distance as u64) % 100 == 0
                        && (mouse_data.total_distance as u64) > 0
                    {
                        println!(
                            "🖱️ Mouse movement milestone: {:.0}px total distance",
                            mouse_data.total_distance
                        );
                    }
                }

                // Update last position
                mouse_data.last_x = x as f64;
                mouse_data.last_y = y as f64;
            });
        }
        EventType::KeyPress(key) => {
            // Check for window switching shortcuts first
        EventType::KeyPress(_) => {
            modify_state(|state| state.keyboard_data.key_downs += 1);

            modify_state(|state| {
                state.keyboard_data.key_downs += 1;

                // Track delete keys separately
                match key {
                    rdev::Key::Backspace | rdev::Key::Delete => {
                        state.keyboard_data.delete_downs += 1;
                        #[cfg(debug_assertions)]
                        println!("⌨️ Delete key down detected: {:?}", key);
                    }
                    _ => {
                        #[cfg(debug_assertions)]
                        println!("⌨️ Key press detected: {:?}", key);
                    }
                }
            });
        }
        EventType::KeyRelease(key) => {
            modify_state(|state| {
                state.keyboard_data.key_ups += 1;

                // Track delete key releases separately
                match key {
                    rdev::Key::Backspace | rdev::Key::Delete => {
                        state.keyboard_data.delete_ups += 1;
                        #[cfg(debug_assertions)]
                        println!("⌨️ Delete key up detected: {:?}", key);
                    }
                    _ => {
                        #[cfg(debug_assertions)]
                        println!("⌨️ Key release detected: {:?}", key);
                    }
                }
            });
        }
        EventType::Wheel { delta_x, delta_y } => {
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
        _ => {
            // Debug: Log all unhandled events to see what touchpad gestures generate
            #[cfg(debug_assertions)]
            println!("🔍 Unhandled event: {:?}", event.event_type);
        }
    }
}
