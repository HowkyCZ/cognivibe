use chrono::{Datelike, Local, Timelike};
#[cfg(debug_assertions)]
use comfy_table::{modifiers::UTF8_ROUND_CORNERS, presets::UTF8_FULL, ContentArrangement, Table};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;
use crate::modules::tracker::functions::upload_data::{upload_tracking_data, LogData};
#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;

/// Helper function to reset only the counter data
fn reset_counters(app_state: &mut AppState) {
    app_state.mouse_data.left_clicks = 0;
    app_state.mouse_data.right_clicks = 0;
    app_state.mouse_data.other_clicks = 0;
    app_state.mouse_data.total_distance = 0.0;
    app_state.mouse_data.wheel_scroll_distance = 0.0;
    app_state.keyboard_data.key_downs = 0;
    app_state.keyboard_data.key_ups = 0;
    app_state.keyboard_data.delete_downs = 0;
    app_state.keyboard_data.delete_ups = 0;
}

/// Starts a background thread that logs input tracking data every minute.
///
/// This function creates a simple thread that:
/// - Waits until the start of each new minute
/// - Logs and resets accumulated data if measuring is active
/// - Uploads data to the server if a user session is active
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
                    if app_state.is_measuring {
                        if !app_state.is_first_minute {
                            #[cfg(debug_assertions)]
                            log_tracking_table(&app_state, now.hour(), current_minute - 1);

                            // Prepare log data for upload
                            if let Some(session) = &app_state.session_data {
                                let log_data = LogData {
                                    mouse_left_clicks_count: app_state.mouse_data.left_clicks,
                                    mouse_right_clicks_count: app_state.mouse_data.right_clicks,
                                    mouse_other_clicks_count: app_state.mouse_data.other_clicks,
                                    keyboard_key_downs_count: app_state.keyboard_data.key_downs,
                                    keyboard_key_ups_count: app_state.keyboard_data.key_ups,
                                    mouse_move_distance: app_state.mouse_data.total_distance,
                                    mouse_scroll_distance: app_state
                                        .mouse_data
                                        .wheel_scroll_distance,
                                    app_switch_count: 1, // Placeholder for now
                                    minute_timestamp: format!(
                                        "{:04}-{:02}-{:02}T{:02}:{:02}:00Z",
                                        now.year(),
                                        now.month(),
                                        now.day(),
                                        now.hour(),
                                        current_minute.saturating_sub(1)
                                    ),
                                    user_id: session.user_id.clone(),
                                };

                                // Spawn async task to upload data
                                let app_handle_clone = app_handle.clone();
                                tauri::async_runtime::spawn(async move {
                                    let state = app_handle_clone.state::<Mutex<AppState>>();
                                    if let Err(e) = upload_tracking_data(state, log_data).await {
                                        #[cfg(debug_assertions)]
                                        eprintln!(
                                            "{}Failed to upload tracking data: {}",
                                            get_tracker_prefix(),
                                            e
                                        );
                                    }
                                });
                            }
                        } else {
                            // If this is the first measurement, just reset counters, since we don't have a full minute of data
                            #[cfg(debug_assertions)]
                            println!(
                                "{}⏱️First measurement (incomplete minute), not logging data yet and resetting counters",
                                get_tracker_prefix()
                            );
                            app_state.is_first_minute = false;
                        }

                        reset_counters(&mut app_state);
                    }
                }
                last_logged_minute = Some(current_minute);
            }

            // Check every second
            thread::sleep(Duration::from_secs(1));
        }
    });
}

/// Logs the tracking data in a formatted table
#[cfg(debug_assertions)]
fn log_tracking_table(app_state: &AppState, hour: u32, minute: u8) {
    println!("{}", get_tracker_prefix());

    let mut table = Table::new();
    table
        .load_preset(UTF8_FULL)
        .apply_modifier(UTF8_ROUND_CORNERS)
        .set_content_arrangement(ContentArrangement::Dynamic)
        .set_width(80)
        .set_header(vec![
            "Time",
            "Left Clicks",
            "Right Clicks",
            "Other Clicks",
            "Distance (px)",
            "Wheel Scroll",
            "Key Downs",
            "Key Ups",
            "Delete Downs",
            "Delete Ups",
        ]);

    table.add_row(vec![
        &format!("{}:{:02}:00", hour, minute),
        &format!("{}", app_state.mouse_data.left_clicks),
        &format!("{}", app_state.mouse_data.right_clicks),
        &format!("{}", app_state.mouse_data.other_clicks),
        &format!("{:.1}", app_state.mouse_data.total_distance),
        &format!("{:.1}", app_state.mouse_data.wheel_scroll_distance),
        &format!("{}", app_state.keyboard_data.key_downs),
        &format!("{}", app_state.keyboard_data.key_ups),
        &format!("{}", app_state.keyboard_data.delete_downs),
        &format!("{}", app_state.keyboard_data.delete_ups),
    ]);

    println!("{}", table);
}
