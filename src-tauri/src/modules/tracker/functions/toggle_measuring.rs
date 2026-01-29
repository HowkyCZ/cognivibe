use std::sync::Mutex;
use tauri::State;

use super::reset_input_data::reset_input_data;
use crate::modules::state::AppState;
#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;

#[tauri::command]
/**
Toggles the measurement state of the application.

When starting measurement: resets all tracking data to start fresh.
When stopping measurement: preserves current data but stops collection.

Returns the new measuring state (true if now measuring, false if stopped).
*/
pub fn toggle_measuring(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> bool {
    let new_state = match state.lock() {
        Ok(mut app_state) => {
            app_state.is_measuring = !app_state.is_measuring;
            let new_state = app_state.is_measuring;
            // Release the lock before calling reset_input_data
            drop(app_state);
            new_state
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("{}⚠️ Failed to lock app state when toggling measurement: {}", get_tracker_prefix(), e);
            // Return false (not measuring) as safe default
            return false;
        }
    };

    if new_state {
        #[cfg(debug_assertions)]
        println!("{}🟢Measurement started", get_tracker_prefix());
        reset_input_data(&app);
    } else {
        // Log measurement summary when stopping
        #[cfg(debug_assertions)]
        {
            if let Ok(app_state) = state.lock() {
                let active_event_count = app_state.keyboard_data.key_downs
                    + app_state.mouse_data.left_clicks
                    + app_state.mouse_data.right_clicks
                    + app_state.mouse_data.other_clicks
                    + app_state.mouse_data.wheel_scroll_events
                    + app_state.mouse_data.move_events;

                println!("{}🛑Measurement stopped", get_tracker_prefix());
                println!(
                    "{}   Summary - Mouse: {} left, {} right, {} other clicks | Distance: {:.1}px | Wheel events: {} | Move events: {}",
                    get_tracker_prefix(),
                    app_state.mouse_data.left_clicks,
                    app_state.mouse_data.right_clicks,
                    app_state.mouse_data.other_clicks,
                    app_state.mouse_data.total_distance,
                    app_state.mouse_data.wheel_scroll_events,
                    app_state.mouse_data.move_events
                );
                println!(
                    "{}   Summary - Keyboard: {} downs, {} ups | Delete: {} downs, {} ups | Window changes: {} | Total active events: {}",
                    get_tracker_prefix(),
                    app_state.keyboard_data.key_downs,
                    app_state.keyboard_data.key_ups,
                    app_state.keyboard_data.delete_downs,
                    app_state.keyboard_data.delete_ups,
                    app_state.window_change_count,
                    active_event_count
                );
            }
        }
    }

    new_state
}
