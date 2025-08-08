use rdev::listen;
use std::thread;
use tauri::AppHandle;

use super::input_callback::{input_callback, INPUT_APP_HANDLE};
use super::start_minute_logger::start_minute_logger;
#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;

/// Initializes and starts the global input tracking system.
///
/// This function:
/// - Stores the app handle globally for use by input callbacks
/// - Starts a background thread that listens for all system input events
/// - Provides platform-specific error messages and setup instructions
/// - Starts the minute logger for periodic data logging
///
pub fn start_global_input_tracker(app_handle: AppHandle) {
    // Store app handle globally using OnceLock
    let _ = INPUT_APP_HANDLE.set(app_handle.clone());

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
                "{}✅ Input tracking started successfully",
                get_tracker_prefix()
            );
        }

        // If we reach this point, the listener has stopped unexpectedly
        #[cfg(debug_assertions)]
        println!(
            "{}⚠️ Input tracker stopped unexpectedly",
            get_tracker_prefix()
        );
    });

    // Start the minute logger
    start_minute_logger(app_handle);
}
