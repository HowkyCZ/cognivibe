use chrono::{Datelike, Local, Timelike};
#[cfg(debug_assertions)]
use comfy_table::{modifiers::UTF8_ROUND_CORNERS, presets::UTF8_FULL, ContentArrangement, Table};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::modules::state::AppState;
use crate::modules::tracker::functions::upload_data::{upload_tracking_data, LogData};
use crate::modules::tracker::functions::calculate_majority_category::calculate_majority_category_for_minute;
use crate::modules::tracker::functions::session_management::{create_session, end_session};
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
/// - Manages session lifecycle (create/end based on activity)
/// - Uses a simple 60-second interval timer
/// - The first measurement is ignored (could be half a minute)
pub fn start_minute_logger(app_handle: AppHandle) {
    thread::spawn(move || {
        let mut last_logged_minute = None;
        const INACTIVITY_THRESHOLD_SECS: u64 = 5 * 60; // 5 minutes

        loop {
            let now = Local::now();
            let current_minute = now.minute() as u8;

            // Only log at the start of a new minute and avoid duplicate logging
            if now.second() == 0 && last_logged_minute != Some(current_minute) {
                if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                    if app_state.is_measuring {
                        // Check for inactivity and end session if needed
                        if let (Some(last_activity), Some(session_id)) = (
                            app_state.last_activity_time,
                            app_state.current_session_id.clone(),
                        ) {
                            let inactivity_duration = last_activity.elapsed().as_secs();
                            #[cfg(debug_assertions)]
                            println!(
                                "{}⏱️ Checking inactivity: {}s / {}s threshold",
                                get_tracker_prefix(),
                                inactivity_duration,
                                INACTIVITY_THRESHOLD_SECS
                            );
                            if inactivity_duration >= INACTIVITY_THRESHOLD_SECS {
                                #[cfg(debug_assertions)]
                                println!(
                                    "{}🛑 Inactivity threshold exceeded, ending session: {}",
                                    get_tracker_prefix(),
                                    session_id
                                );
                                // End session due to inactivity
                                let session_id_clone = session_id.clone();
                                if let Some(session) = app_state.session_data.as_ref() {
                                    let session_access_token = session.access_token.clone();
                                    let _app_handle_clone = app_handle.clone();
                                    tauri::async_runtime::spawn(async move {
                                        match end_session(session_id_clone, session_access_token).await {
                                            Ok(_) => {
                                                #[cfg(debug_assertions)]
                                                println!(
                                                    "{}✅ Session ended due to inactivity",
                                                    get_tracker_prefix()
                                                );
                                            }
                                            Err(_e) => {
                                                #[cfg(debug_assertions)]
                                                eprintln!(
                                                    "{}❌ Failed to end session: {}",
                                                    get_tracker_prefix(),
                                                    _e
                                                );
                                            }
                                        }
                                    });
                                } else {
                                    #[cfg(debug_assertions)]
                                    eprintln!(
                                        "{}❌ Cannot end session - no session_data available",
                                        get_tracker_prefix()
                                    );
                                }
                                // Clear session state locally
                                #[cfg(debug_assertions)]
                                println!(
                                    "{}🧹 Clearing session state locally",
                                    get_tracker_prefix()
                                );
                                app_state.current_session_id = None;
                                app_state.last_activity_time = None;
                                app_state.session_start_time = None;
                            }
                        }

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
                                // Clone session data before potential mutations
                                let session_user_id = session.user_id.clone();
                                let session_access_token = session.access_token.clone();
                                
                                // Ensure we have an active session before uploading
                                let session_id = if app_state.current_session_id.is_none() {
                                    #[cfg(debug_assertions)]
                                    println!(
                                        "{}🚀 No active session found, creating new session...",
                                        get_tracker_prefix()
                                    );
                                    // Create new session
                                    let user_id = session_user_id.clone();
                                    let access_token = session_access_token.clone();
                                    
                                    // Create session synchronously (blocking)
                                    let session_result = tauri::async_runtime::block_on(async {
                                        create_session(user_id, access_token).await
                                    });

                                    match session_result {
                                        Ok(new_session_id) => {
                                            #[cfg(debug_assertions)]
                                            println!(
                                                "{}✅ Created new session: {}",
                                                get_tracker_prefix(),
                                                new_session_id
                                            );
                                            app_state.current_session_id = Some(new_session_id.clone());
                                            app_state.session_start_time = Some(std::time::Instant::now());
                                            #[cfg(debug_assertions)]
                                            println!(
                                                "{}📝 Session state updated: session_id={}, start_time set",
                                                get_tracker_prefix(),
                                                new_session_id
                                            );
                                            Some(new_session_id)
                                        }
                                        Err(_e) => {
                                            #[cfg(debug_assertions)]
                                            eprintln!(
                                                "{}❌ Failed to create session: {}",
                                                get_tracker_prefix(),
                                                _e
                                            );
                                            #[cfg(debug_assertions)]
                                            eprintln!(
                                                "{}⚠️ Continuing without session_id - data will not be uploaded",
                                                get_tracker_prefix()
                                            );
                                            None // Continue without session_id if creation fails
                                        }
                                    }
                                } else {
                                    #[cfg(debug_assertions)]
                                    println!(
                                        "{}✅ Using existing session: {}",
                                        get_tracker_prefix(),
                                        app_state.current_session_id.as_ref().unwrap()
                                    );
                                    app_state.current_session_id.clone()
                                };

                                // Calculate active_event_count: sum of all events
                                let active_event_count = app_state.keyboard_data.key_downs
                                    + app_state.mouse_data.left_clicks
                                    + app_state.mouse_data.right_clicks
                                    + app_state.mouse_data.other_clicks
                                    + app_state.mouse_data.wheel_scroll_events
                                    + app_state.mouse_data.move_events;

                                // Skip logging zero-activity minutes (no user interaction)
                                // But still reset counters and update last_logged_minute
                                if active_event_count == 0 {
                                    #[cfg(debug_assertions)]
                                    println!(
                                        "{}⏭️ Skipping zero-activity minute (no events recorded)",
                                        get_tracker_prefix()
                                    );
                                    // Still reset counters even if we skip logging
                                    reset_counters(&mut app_state);
                                    // Update last_logged_minute to prevent duplicate logging
                                    // Note: We need to drop the lock before continuing
                                    last_logged_minute = Some(current_minute);
                                    // Drop the lock before continuing the loop
                                    drop(app_state);
                                    continue;
                                }

                                let minute_timestamp = format!(
                                    "{:04}-{:02}-{:02}T{:02}:{:02}:00Z",
                                    now.year(),
                                    now.month(),
                                    now.day(),
                                    prev_hour,
                                    prev_minute
                                );

                                // Calculate majority category for the previous minute
                                let app_category = {
                                    // Calculate minute boundaries relative to now
                                    // Previous minute ended at the start of current minute (now.second() == 0)
                                    // So minute_start is 60 seconds ago, minute_end is now
                                    let now_instant = std::time::Instant::now();
                                    let minute_start_instant = now_instant.checked_sub(Duration::from_secs(60))
                                        .unwrap_or(now_instant);
                                    let minute_end_instant = now_instant;
                                    
                                    Some(calculate_majority_category_for_minute(
                                        &app_state.category_change_history,
                                        minute_start_instant,
                                        minute_end_instant,
                                        app_state.current_app_category.as_ref(),
                                    ))
                                };

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
                                    window_change_count: app_state.window_change_count,
                                    backspace_count: app_state.keyboard_data.delete_downs,
                                    active_event_count,
                                    screen_resolution_multiplier: app_state.screen_resolution_multiplier,
                                    wheel_scroll_events_count: app_state.mouse_data.wheel_scroll_events,
                                    minute_timestamp: minute_timestamp.clone(),
                                    user_id: session_user_id.clone(),
                                    app_category,
                                    session_id: session_id.clone(),
                                };

                                // Spawn async task to upload data
                                let app_handle_clone = app_handle.clone();
                                let _session_id_clone = session_id.clone();
                                #[cfg(debug_assertions)]
                                let timestamp_for_log = minute_timestamp.clone();
                                tauri::async_runtime::spawn(async move {
                                    let state = app_handle_clone.state::<Mutex<AppState>>();
                                    match upload_tracking_data(state, log_data).await {
                                        Ok(_) => {
                                            // Update last_activity_time on successful upload
                                            if let Ok(mut app_state) = app_handle_clone.state::<Mutex<AppState>>().lock() {
                                                app_state.last_activity_time = Some(std::time::Instant::now());
                                            }
                                            #[cfg(debug_assertions)]
                                            println!(
                                                "{}✅ Successfully uploaded tracking data for {}",
                                                get_tracker_prefix(),
                                                timestamp_for_log
                                            );
                                        }
                                        Err(_e) => {
                                            #[cfg(debug_assertions)]
                                            eprintln!(
                                                "{}❌ Failed to upload tracking data: {}",
                                                get_tracker_prefix(),
                                                _e
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
