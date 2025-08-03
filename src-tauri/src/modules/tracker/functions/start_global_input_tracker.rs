use rdev::listen;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::AppHandle;

use super::input_callback::{input_callback, INPUT_APP_HANDLE};
use super::start_minute_logger::start_minute_logger;

/// Initializes and starts the global input tracking system.
///
/// This function:
/// - Stores the app handle globally for use by input callbacks
/// - Starts a background thread that listens for all system input events
/// - Provides platform-specific error messages and setup instructions
/// - Starts the minute logger for periodic data logging
///
/// On MacOs, it requires the user to enable accessibility permissions for the app.
pub fn start_global_input_tracker(app_handle: AppHandle) {
    // Store app handle globally using OnceLock
    let _ = INPUT_APP_HANDLE.set(Arc::new(Mutex::new(app_handle.clone())));

    // Start the input event listener (handles both mouse and keyboard events)
    thread::spawn(move || {
        if let Err(error) = listen(input_callback) {
            #[cfg(debug_assertions)]
            println!("Error starting global input tracker: {:?}", error);
        } else {
            println!("✅ Input tracking started successfully");
        }
    });

    // Start the minute logger
    start_minute_logger(app_handle);
}
