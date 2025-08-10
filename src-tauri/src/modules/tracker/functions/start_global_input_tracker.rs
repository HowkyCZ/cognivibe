use rdev::listen;
use std::sync::{Mutex, OnceLock};
use std::thread;
use tauri::AppHandle;

use super::callback::input_callback::input_callback;
use super::start_minute_logger::start_minute_logger;
use crate::modules::tracker::types::ModifierState;
#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;

/// Global app handle storage for input events using OnceLock for thread safety
pub static INPUT_APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

/// Global state for tracking modifier keys
pub static MODIFIER_STATE: OnceLock<Mutex<ModifierState>> = OnceLock::new();

/// Initialize the global modifier state with default values
fn init_modifier_state() {
    let _ = MODIFIER_STATE.set(Mutex::new(ModifierState::default()));
}

/// Initializes and starts the global input tracking system.
///
/// This function:
/// - Stores the app handle globally for use by input callbacks
/// - Starts a background thread that listens for all system input events
/// - Provides platform-specific error messages and setup instructions
/// - Starts the minute logger for periodic data logging
///
pub fn start_global_input_tracker(app_handle: AppHandle) {
    // Store app handle globally using OnceLock first
    let _ = INPUT_APP_HANDLE.set(app_handle.clone());

    {
        // Initialize the modifier state
        init_modifier_state();
        #[cfg(debug_assertions)]
        println!("{}Modifier state initialized", get_tracker_prefix());
    }

    // Initialize the active window ID in the app state
    {
        use super::log_active_window::log_active_window_async;
        log_active_window_async();
        #[cfg(debug_assertions)]
        println!(
            "{}Initial active window logged and state updated",
            get_tracker_prefix()
        );
    }

    // Start the input event listener (handles both mouse and keyboard events)
    thread::spawn(move || {
        if let Err(error) = listen(input_callback) {
            #[cfg(debug_assertions)]
            println!(
                "{}Error starting global input tracker: {:?}",
                get_tracker_prefix(),
                error
            );
        } else {
            #[cfg(debug_assertions)]
            println!(
                "{}Input tracking started successfully",
                get_tracker_prefix()
            );
        }

        // If we reach this point, the listener has stopped unexpectedly
        #[cfg(debug_assertions)]
        println!("{}Input tracker stopped unexpectedly", get_tracker_prefix());
    });

    // Start the minute logger last (consumes the original app_handle)
    start_minute_logger(app_handle);
}
