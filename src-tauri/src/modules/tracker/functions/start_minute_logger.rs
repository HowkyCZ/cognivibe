use chrono::{Local, Timelike};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;

/// Starts a background thread that logs input tracking data every minute.
/// 
/// This function creates a thread that:
/// - Waits until the start of each new minute
/// - Checks if measuring is currently active
/// - Logs the accumulated mouse and keyboard data
/// - Resets the counters after logging
/// 
/// The logging only occurs when `is_measuring` is true in the app state.
/// In debug builds, the data is printed to console with timestamps.
pub fn start_minute_logger(app_handle: AppHandle) {
    thread::spawn(move || {
        loop {
            let now = Local::now();
            let current_second = now.second() as u8;
            let _current_minute = now.minute() as u8;

            // Calculate how many seconds until the next minute
            let seconds_until_next_minute = 60 - current_second;

            // Sleep until the next minute mark
            thread::sleep(Duration::from_secs(seconds_until_next_minute as u64));

            // Check if we should log (only when measuring is active)
            if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                if app_state.is_measuring {
                    let new_minute = Local::now().minute() as u8;

                    // Only log if we haven't logged this minute yet
                    if app_state.mouse_data.last_logged_minute != new_minute
                        || app_state.keyboard_data.last_logged_minute != new_minute
                    {
                        let mouse_data = app_state.mouse_data.clone();
                        let keyboard_data = app_state.keyboard_data.clone();

                        #[cfg(debug_assertions)]
                        println!(
                            "[{}] Minute {} - Mouse Downs: {}, Mouse Ups: {}, Distance: {:.1}px, Key Downs: {}, Key Ups: {}",
                            Local::now().format("%Y-%m-%d %H:%M:%S"),
                            new_minute,
                            mouse_data.mouse_downs,
                            mouse_data.mouse_ups,
                            mouse_data.total_distance,
                            keyboard_data.key_downs,
                            keyboard_data.key_ups
                        );

                        // Reset the counts after logging
                        app_state.mouse_data.mouse_downs = 0;
                        app_state.mouse_data.mouse_ups = 0;
                        app_state.mouse_data.total_distance = 0.0;
                        app_state.mouse_data.last_logged_minute = new_minute;
                        app_state.keyboard_data.key_downs = 0;
                        app_state.keyboard_data.key_ups = 0;
                        app_state.keyboard_data.last_logged_minute = new_minute;
                    }
                }
            }
        }
    });
}
