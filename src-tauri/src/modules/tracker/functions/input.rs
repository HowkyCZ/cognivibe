use chrono::{Local, Timelike};
use rdev::{listen, Event, EventType};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

use crate::AppState;
use crate::modules::tracker::types::{MouseData, KeyboardData};

// Global app handle storage for input events using OnceLock for thread safety
static INPUT_APP_HANDLE: OnceLock<Arc<Mutex<AppHandle>>> = OnceLock::new();

fn input_callback(event: Event) {
    // Check if we should track events (only when measuring is active)
    let should_track = if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
        if let Ok(app_handle) = app_handle_arc.lock() {
            if let Ok(app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                app_state.is_measuring
            } else {
                false
            }
        } else {
            false
        }
    } else {
        false
    };

    // Only proceed if measuring is active
    if !should_track {
        return;
    }

    // Track both mouse and keyboard events
    match event.event_type {
        EventType::ButtonPress(_button) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.mouse_data.mouse_downs += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Mouse down detected. Total downs: {}",
                            app_state.mouse_data.mouse_downs
                        );
                    }
                }
            }
        }
        EventType::ButtonRelease(_button) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.mouse_data.mouse_ups += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Mouse up detected. Total ups: {}",
                            app_state.mouse_data.mouse_ups
                        );
                    }
                }
            }
        }
        EventType::MouseMove { x, y } => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        // Calculate distance if we have a previous position
                        if app_state.mouse_data.last_x != 0.0 || app_state.mouse_data.last_y != 0.0
                        {
                            let dx = x as f64 - app_state.mouse_data.last_x;
                            let dy = y as f64 - app_state.mouse_data.last_y;
                            let distance = (dx * dx + dy * dy).sqrt();
                            app_state.mouse_data.total_distance += distance;
                        }

                        // Update last position
                        app_state.mouse_data.last_x = x as f64;
                        app_state.mouse_data.last_y = y as f64;

                        // Only print occasionally to avoid spam (every 100 pixels of movement)
                        #[cfg(debug_assertions)]
                        if app_state.mouse_data.total_distance as u64 % 100 == 0 {
                            println!(
                                "Mouse distance: {:.1} pixels",
                                app_state.mouse_data.total_distance
                            );
                        }
                    }
                }
            }
        }
        EventType::KeyPress(_key) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.keyboard_data.key_downs += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Key down detected. Total key downs: {}",
                            app_state.keyboard_data.key_downs
                        );
                    }
                }
            }
        }
        EventType::KeyRelease(_key) => {
            if let Some(app_handle_arc) = INPUT_APP_HANDLE.get() {
                if let Ok(app_handle) = app_handle_arc.lock() {
                    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                        app_state.keyboard_data.key_ups += 1;
                        #[cfg(debug_assertions)]
                        println!(
                            "Key up detected. Total key ups: {}",
                            app_state.keyboard_data.key_ups
                        );
                    }
                }
            }
        }
        _ => {
            // Ignore all other events (wheel, etc.)
        }
    }
}

fn start_minute_logger(app_handle: AppHandle) {
    thread::spawn(move || {
        loop {
            let now = Local::now();
            let current_second = now.second() as u8;
            let _current_minute = now.minute() as u8;

            // Calculate how many seconds until the next minute
            let seconds_until_next_minute = 60 - current_second;

            // Sleep until the next minute mark
            thread::sleep(Duration::from_secs(seconds_until_next_minute as u64));

            // Check if we should log (only when measuring is active)
            if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
                if app_state.is_measuring {
                    let new_minute = Local::now().minute() as u8;

                    // Only log if we haven't logged this minute yet
                    if app_state.mouse_data.last_logged_minute != new_minute
                        || app_state.keyboard_data.last_logged_minute != new_minute
                    {
                        let mouse_data = app_state.mouse_data.clone();
                        let keyboard_data = app_state.keyboard_data.clone();

                        #[cfg(debug_assertions)]
                        println!(
                            "[{}] Minute {} - Mouse Downs: {}, Mouse Ups: {}, Distance: {:.1}px, Key Downs: {}, Key Ups: {}",
                            Local::now().format("%Y-%m-%d %H:%M:%S"),
                            new_minute,
                            mouse_data.mouse_downs,
                            mouse_data.mouse_ups,
                            mouse_data.total_distance,
                            keyboard_data.key_downs,
                            keyboard_data.key_ups
                        );

                        // Reset the counts after logging
                        app_state.mouse_data.mouse_downs = 0;
                        app_state.mouse_data.mouse_ups = 0;
                        app_state.mouse_data.total_distance = 0.0;
                        app_state.mouse_data.last_logged_minute = new_minute;
                        app_state.keyboard_data.key_downs = 0;
                        app_state.keyboard_data.key_ups = 0;
                        app_state.keyboard_data.last_logged_minute = new_minute;
                    }
                }
            }
        }
    });
}

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

// Tauri commands for input tracking
#[tauri::command]
pub fn get_mouse_data_cmd(state: State<'_, Mutex<AppState>>) -> MouseData {
    let state = state.lock().unwrap();
    state.mouse_data.clone()
}

#[tauri::command]
pub fn get_keyboard_data_cmd(state: State<'_, Mutex<AppState>>) -> KeyboardData {
    let state = state.lock().unwrap();
    state.keyboard_data.clone()
}

#[tauri::command]
pub fn get_mouse_distance_cmd(state: State<'_, Mutex<AppState>>) -> f64 {
    let state = state.lock().unwrap();
    state.mouse_data.total_distance
}

#[tauri::command]
pub fn reset_mouse_tracking_cmd(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state = state.lock().unwrap();
    state.mouse_data = MouseData::default();
    Ok(())
}

#[tauri::command]
pub fn reset_keyboard_tracking_cmd(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state = state.lock().unwrap();
    state.keyboard_data = KeyboardData::default();
    Ok(())
}

// Helper function to reset both mouse and keyboard data when measurement starts
pub fn reset_input_data(app_handle: &AppHandle) {
    if let Ok(mut app_state) = app_handle.state::<Mutex<AppState>>().lock() {
        app_state.mouse_data = MouseData::default();
        app_state.keyboard_data = KeyboardData::default();
        #[cfg(debug_assertions)]
        println!("Mouse and keyboard tracking data reset");
    }
}
