use crate::AppState;
use chrono::Local;
use rdev::{listen, Event, EventType};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

// Global app handle storage for keystroke events using OnceLock for thread safety
static APP_HANDLE: OnceLock<Arc<Mutex<AppHandle>>> = OnceLock::new();

fn keystroke_callback(event: Event) {
    // Check if we should log keystrokes (only when measuring is active)
    let should_log = if let Some(app_handle_arc) = APP_HANDLE.get() {
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
    if !should_log {
        return;
    }

    let timestamp = Local::now();
    let timezone_hours = timestamp.offset().local_minus_utc() / 3600;
    let formatted_time = format!(
        "{}{:+03}",
        timestamp.format("%Y-%m-%d %H:%M:%S%.6f"),
        timezone_hours
    );

    match event.event_type {
        EventType::KeyPress(key) => {
            let key_name = format!("{:?}", key);
            println!("[{}] Key pressed: {}", formatted_time, key_name);

            // Create structured data for frontend
            let keystroke_data = serde_json::json!({
                "timestamp": timestamp.to_rfc3339(),
                "event_type": "press",
                "key": key_name            });

            // Emit to frontend using global app handle
            if let Some(app_handle_arc) = APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    let _ = app_handle.emit("keystroke", &keystroke_data);
                }
            }
        }
        EventType::KeyRelease(key) => {
            let key_name = format!("{:?}", key);
            println!("[{}] Key released: {}", formatted_time, key_name);

            // Create structured data for frontend
            let keystroke_data = serde_json::json!({
                "timestamp": timestamp.to_rfc3339(),
                "event_type": "release",
                "key": key_name
            }); // Emit to frontend using global app handle
            if let Some(app_handle_arc) = APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    let _ = app_handle.emit("keystroke", &keystroke_data);
                }
            }
        }
        _ => {}
    }
}

pub fn start_global_keystroke_listener(app_handle: AppHandle) {
    // Store app handle globally using OnceLock
    let _ = APP_HANDLE.set(Arc::new(Mutex::new(app_handle)));

    thread::spawn(move || {
        if let Err(error) = listen(keystroke_callback) {
            println!("Error starting global keystroke listener: {:?}", error);
        }
    });
}
