use std::sync::Mutex;
use tauri::Manager;

use crate::modules::state::AppState;
use super::start_global_input_tracker::INPUT_APP_HANDLE;

/// Helper function to check if measuring is currently active
pub fn get_is_measuring() -> bool {
    if let Some(app) = INPUT_APP_HANDLE.get() {
        if let Ok(state) = app.state::<Mutex<AppState>>().lock() {
            return state.is_measuring;
        }
    }
    false
}
