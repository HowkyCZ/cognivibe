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
    app_state.mouse_data.wheel_scroll_events = 0;
    app_state.mouse_data.move_events = 0;
    app_state.keyboard_data.key_downs = 0;
    app_state.keyboard_data.key_ups = 0;
    app_state.keyboard_data.delete_downs = 0;
    app_state.keyboard_data.delete_ups = 0;
    app_state.window_change_count = 0;
    // Note: screen_resolution_multiplier and last_scroll_event_time are not reset
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
                            // Calculate the previous minute and hour (handling wrap-around)
                            let (prev_hour, prev_minute) = if current_minute == 0 {
                                // If we're at minute 0, previous minute was 59 of previous hour
                                let prev_h = if now.hour() == 0 { 23 } else { now.hour() - 1 };
                                (prev_h, 59)
                            } else {
                                (now.hour(), current_minute - 1)
                            };

                            #[cfg(debug_assertions)]
                            log_tracking_table(&app_state, prev_hour, prev_minute);

                            // Prepare log data for upload
                            if let Some(session) = &app_state.session_data {
                                // Calculate active_event_count: sum of all events
                                let active_event_count = app_state.keyboard_data.key_downs
                                    + app_state.mouse_data.left_clicks
                                    + app_state.mouse_data.right_clicks
                                    + app_state.mouse_data.other_clicks
                                    + app_state.mouse_data.wheel_scroll_events
                                    + app_state.mouse_data.move_events;

                                let minute_timestamp = format!(
                                    "{:04}-{:02}-{:02}T{:02}:{:02}:00Z",
                                    now.year(),
                                    now.month(),
                                    now.day(),
                                    prev_hour,
                                    prev_minute
                                );

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
                                    window_change_count: app_state.window_change_count,
                                    backspace_count: app_state.keyboard_data.delete_downs,
                                    active_event_count,
                                    screen_resolution_multiplier: app_state.screen_resolution_multiplier,
                                    wheel_scroll_events_count: app_state.mouse_data.wheel_scroll_events,
                                    minute_timestamp: minute_timestamp.clone(),
                                    user_id: session.user_id.clone(),
                                };

                                // Spawn async task to upload data
                                let app_handle_clone = app_handle.clone();
                                #[cfg(debug_assertions)]
                                let timestamp_for_log = minute_timestamp.clone();
                                tauri::async_runtime::spawn(async move {
                                    let state = app_handle_clone.state::<Mutex<AppState>>();
                                    match upload_tracking_data(state, log_data).await {
                                        Ok(_) => {
                                            #[cfg(debug_assertions)]
                                            println!(
                                                "{}✅ Successfully uploaded tracking data for {}",
                                                get_tracker_prefix(),
                                                timestamp_for_log
                                            );
                                        }
                                        Err(e) => {
                                            #[cfg(debug_assertions)]
                                            eprintln!(
                                                "{}❌ Failed to upload tracking data: {}",
                                                get_tracker_prefix(),
                                                e
                                            );
                                        }
                                    }
                                });
                            } else {
                                #[cfg(debug_assertions)]
                                println!(
                                    "{}⚠️ No active session - tracking data not uploaded (user not logged in)",
                                    get_tracker_prefix()
                                );
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
    // Calculate active_event_count for display
    let active_event_count = app_state.keyboard_data.key_downs
        + app_state.mouse_data.left_clicks
        + app_state.mouse_data.right_clicks
        + app_state.mouse_data.other_clicks
        + app_state.mouse_data.wheel_scroll_events
        + app_state.mouse_data.move_events;

    println!("{}", get_tracker_prefix());

    let mut table = Table::new();
    table
        .load_preset(UTF8_FULL)
        .apply_modifier(UTF8_ROUND_CORNERS)
        .set_content_arrangement(ContentArrangement::Dynamic)
        .set_width(100)
        .set_header(vec![
            "Time",
            "Left Clicks",
            "Right Clicks",
            "Other Clicks",
            "Distance (px)",
            "Wheel Events",
            "Move Events",
            "Key Downs",
            "Key Ups",
            "Delete Downs",
            "Delete Ups",
            "Window Changes",
            "Active Events",
            "Res Mult",
        ]);

    table.add_row(vec![
        &format!("{}:{:02}:00", hour, minute),
        &format!("{}", app_state.mouse_data.left_clicks),
        &format!("{}", app_state.mouse_data.right_clicks),
        &format!("{}", app_state.mouse_data.other_clicks),
        &format!("{:.1}", app_state.mouse_data.total_distance),
        &format!("{}", app_state.mouse_data.wheel_scroll_events),
        &format!("{}", app_state.mouse_data.move_events),
        &format!("{}", app_state.keyboard_data.key_downs),
        &format!("{}", app_state.keyboard_data.key_ups),
        &format!("{}", app_state.keyboard_data.delete_downs),
        &format!("{}", app_state.keyboard_data.delete_ups),
        &format!("{}", app_state.window_change_count),
        &format!("{}", active_event_count),
        &format!(
            "{}",
            app_state
                .screen_resolution_multiplier
                .map(|m| format!("{:.4}", m))
                .unwrap_or_else(|| "N/A".to_string())
        ),
    ]);

    println!("{}", table);
}
