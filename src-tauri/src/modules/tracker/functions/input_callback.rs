use rdev::{Event, EventType};
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;

/// Global app handle storage for input events using OnceLock for thread safety
pub static INPUT_APP_HANDLE: OnceLock<Arc<Mutex<AppHandle>>> = OnceLock::new();

/// Callback function that processes input events (mouse and keyboard) from the system.
///
/// This function is called by the rdev library for every input event when tracking is active.
/// It filters events based on whether measuring is currently enabled, then tracks:
/// - Mouse button presses/releases and movement distance
/// - Keyboard key presses/releases
///
/// The data is stored in the global app state for later logging and analysis.
pub fn input_callback(event: Event) {
    // Check if we should track events (only when measuring is active)
    let should_track = if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
        if let Ok(app_handle) = app_handle_arc.lock() {
            if let Ok(app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                app_state.is_measuring
            } else {
                false
            }
        } else {
            false
        }
    } else {
        false
    };

    // Only proceed if measuring is active
    if !should_track {
        return;
    }

    // Track both mouse and keyboard events
    match event.event_type {
        EventType::ButtonPress(_button) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.mouse_data.mouse_downs += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Mouse down detected. Total downs: {}",
                            app_state.mouse_data.mouse_downs
                        );
                    }
                }
            }
        }
        EventType::ButtonRelease(_button) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.mouse_data.mouse_ups += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Mouse up detected. Total ups: {}",
                            app_state.mouse_data.mouse_ups
                        );
                    }
                }
            }
        }
        EventType::MouseMove { x, y } => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        // Calculate distance if we have a previous position
                        if app_state.mouse_data.last_x != 0.0 || app_state.mouse_data.last_y != 0.0
                        {
                            let dx = x as f64 - app_state.mouse_data.last_x;
                            let dy = y as f64 - app_state.mouse_data.last_y;
                            let distance = (dx * dx + dy * dy).sqrt();
                            app_state.mouse_data.total_distance += distance;
                        }

                        // Update last position
                        app_state.mouse_data.last_x = x as f64;
                        app_state.mouse_data.last_y = y as f64;

                        // Only print occasionally to avoid spam (every 100 pixels of movement)
                        #[cfg(debug_assertions)]
                        if app_state.mouse_data.total_distance as u64 % 100 == 0 {
                            println!(
                                "Mouse distance: {:.1} pixels",
                                app_state.mouse_data.total_distance
                            );
                        }
                    }
                }
            }
        }
        EventType::KeyPress(_key) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.keyboard_data.key_downs += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Key down detected. Total key downs: {}",
                            app_state.keyboard_data.key_downs
                        );
                    }
                }
            }
        }
        EventType::KeyRelease(_key) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.keyboard_data.key_ups += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Key up detected. Total key ups: {}",
                            app_state.keyboard_data.key_ups
                        );
                    }
                }
            }
        }
        _ => {
            // Ignore all other events (wheel, etc.)
        }
    }
}
