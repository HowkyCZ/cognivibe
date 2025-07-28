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
/// On macOS, it provides helpful instructions for granting Accessibility permissions
/// if the input tracking fails to start. The app will continue to work even if
/// input tracking fails, but tracking functionality will be disabled.
pub fn start_global_input_tracker(app_handle: AppHandle) {
    // Store app handle globally using OnceLock
    let _ = INPUT_APP_HANDLE.set(Arc::new(Mutex::new(app_handle.clone())));

    // Start the input event listener (handles both mouse and keyboard events)
    thread::spawn(move || {
        #[cfg(target_os = "macos")]
        {
            println!("🍎 Starting input tracker on macOS");
            println!("ℹ️  If input tracking doesn't work, please:");
            println!(
                "   1. Go to System Preferences → Security & Privacy → Privacy → Accessibility"
            );
            println!("   2. Add 'Cognivibe' to the list and enable the checkbox");
            println!("   3. Restart the application");
        }

        if let Err(error) = listen(input_callback) {
            #[cfg(debug_assertions)]
            println!("Error starting global input tracker: {:?}", error);

            #[cfg(target_os = "macos")]
            {
                println!("❌ Input tracking failed on macOS: {:?}", error);
                println!("This might be due to:");
                println!("1. Missing Accessibility permissions");
                println!("2. Incompatible rdev version with this macOS/hardware");
                println!("3. System security restrictions");
                println!("Please grant Accessibility permission in System Preferences.");
                println!(
                    "Note: The app will continue to work, but input tracking will be disabled."
                );
            }

            #[cfg(not(target_os = "macos"))]
            {
                println!("❌ Input tracking failed: {:?}", error);
                println!("The app will continue to work, but input tracking will be disabled.");
            }
        } else {
            println!("✅ Input tracking started successfully");
        }
    });

    // Start the minute logger
    start_minute_logger(app_handle);
}
