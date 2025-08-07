use std::sync::Mutex;
use tauri::State;

use super::reset_input_data::reset_input_data;
use crate::modules::state::AppState;

#[tauri::command]
/**
Toggles the measurement state of the application.

When starting measurement: resets all tracking data to start fresh.
When stopping measurement: preserves current data but stops collection.

Returns the new measuring state (true if now measuring, false if stopped).
*/
pub fn toggle_measuring(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> bool {
    let mut app_state = state.lock().unwrap();
    app_state.is_measuring = !app_state.is_measuring;
    let new_state = app_state.is_measuring;

    // Release the lock before calling reset_input_data
    drop(app_state);

    if new_state {
        #[cfg(debug_assertions)]
        println!("🖲️📊 Measurement started");
        reset_input_data(&app);
    } else {
        #[cfg(debug_assertions)]
        println!("🖲️⏹️ Measurement stopped");
    }

    new_state
}
