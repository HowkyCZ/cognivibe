use chrono::{Local, Timelike};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;
#[cfg(debug_assertions)]
use crate::modules::utils::{get_tracker_prefix, TrackerColors};

/// Helper function to reset only the counter data
fn reset_counters(app_state: &mut AppState) {
    app_state.mouse_data.mouse_downs = 0;
    app_state.mouse_data.mouse_ups = 0;
    app_state.mouse_data.total_distance = 0.0;
    app_state.keyboard_data.key_downs = 0;
    app_state.keyboard_data.key_ups = 0;
}

/// Starts a background thread that logs input tracking data every minute.
///
/// This function creates a simple thread that:
/// - Waits until the start of each new minute
/// - Logs and resets accumulated data if measuring is active
/// - Uses a simple 60-second interval timer
/// - The first measurement is ignored (could be half a minute)
pub fn start_minute_logger(app_handle: AppHandle) {
    thread::spawn(move || {
        let mut last_logged_minute = None;

        loop {
            let now = Local::now();
            let current_minute = now.minute() as u8;

            // Only log at the start of a new minute and avoid duplicate logging
            if now.second() == 0 && last_logged_minute != Some(current_minute) {
                if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                    if app_state.is_measuring && !app_state.is_first_minute {
                        // Log the current data
                        #[cfg(debug_assertions)]
                        println!(
                            "{}⏱️ [{}] Minute {} - Mouse: downs={}, ups={}, distance={:.1}px | Keys: downs={}, ups={}",
                            get_tracker_prefix(),
                            TrackerColors::timestamp(&now.format("%H:%M:%S").to_string()),
                            current_minute - 1,
                            app_state.mouse_data.mouse_downs,
                            app_state.mouse_data.mouse_ups,
                            app_state.mouse_data.total_distance,
                            app_state.keyboard_data.key_downs,
                            app_state.keyboard_data.key_ups
                        );

                        reset_counters(&mut app_state);
                    } else if app_state.is_measuring && app_state.is_first_minute {
                        // If this is the first measurement, just reset counters, since we don't have a full minute of data
                        reset_counters(&mut app_state);
                        #[cfg(debug_assertions)]
                        println!(
                            "{}⏱️First measurement (incomplete minute), not logging data yet and resetting counters",
                            get_tracker_prefix()
                        );
                        app_state.is_first_minute = false;
                    }
                }
                last_logged_minute = Some(current_minute);
            }

            // Check every second
            thread::sleep(Duration::from_secs(1));
        }
    });
}
