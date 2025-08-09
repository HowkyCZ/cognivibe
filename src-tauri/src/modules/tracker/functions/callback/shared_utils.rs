use std::sync::Mutex;
use tauri::Manager;

use super::super::start_global_input_tracker::INPUT_APP_HANDLE;
use crate::modules::{state::AppState, tracker::types::ModifierState};

/// Helper function to update modifier key state
pub fn update_modifier_state<F>(f: F)
where
    F: FnOnce(&mut ModifierState),
{
    use super::super::start_global_input_tracker::MODIFIER_STATE;
    if let Some(modifier_state) = MODIFIER_STATE.get() {
        if let Ok(mut state) = modifier_state.lock() {
            f(&mut *state);
        }
    }
}

/// Helper function to safely modify app state
pub fn modify_state<F>(f: F)
where
    F: FnOnce(&mut AppState),
{
    if let Some(app) = INPUT_APP_HANDLE.get() {
        if let Ok(mut state) = app.state::<Mutex<AppState>>().lock() {
            f(&mut *state);
        }
    }
}

/// Helper function to safely read app state
pub fn read_state<F, R>(f: F) -> R
where
    F: FnOnce(&AppState) -> R,
    R: Default,
{
    if let Some(app) = INPUT_APP_HANDLE.get() {
        if let Ok(state) = app.state::<Mutex<AppState>>().lock() {
            return f(&*state);
        }
    }
    R::default()
}
