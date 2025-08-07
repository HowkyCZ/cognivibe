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
        EventType::ButtonPress(_) => {
            modify_state(|state| state.mouse_data.mouse_downs += 1);
        }
        EventType::ButtonRelease(_) => {
            modify_state(|state| state.mouse_data.mouse_ups += 1);
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
                }

                // Update last position
                mouse_data.last_x = x as f64;
                mouse_data.last_y = y as f64;
            });
        }
        EventType::KeyPress(_) => {
            modify_state(|state| state.keyboard_data.key_downs += 1);
        }
        EventType::KeyRelease(_) => {
            modify_state(|state| state.keyboard_data.key_ups += 1);
        }
        _ => {
            // Ignore all other events (wheel, etc.)
        }
    }
}
