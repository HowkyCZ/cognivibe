#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;
use active_win_pos_rs::get_active_window;
#[cfg(debug_assertions)]
use active_win_pos_rs::ActiveWindow;
use crate::modules::state::CategoryChangeEvent;
use crate::modules::tracker::functions::search_app_directory::{search_app_directory, extract_domain_from_browser_title};
use std::path::PathBuf;
use std::time::Instant;
use tauri::Manager;

/// Represents the type of change detected
enum ChangeType {
    WindowChanged,
    TabChanged,
    NoChange,
}

/// Checks if the given application is a browser based on app name and process path.
fn is_browser_app(app_name: &str, process_path: &PathBuf) -> bool {
    let app_name_lower = app_name.to_lowercase();
    let process_path_str = process_path.to_string_lossy().to_lowercase();

    // Check app name
    let browser_names = [
        "chrome",
        "chromium",
        "google chrome",
        "firefox",
        "safari",
        "microsoft edge",
        "msedge",
        "opera",
        "brave",
        "vivaldi",
        "arc",
    ];

    for browser in &browser_names {
        if app_name_lower.contains(browser) || process_path_str.contains(browser) {
            return true;
        }
    }

    false
}

fn log_active_window() {
    use super::start_global_input_tracker::INPUT_APP_HANDLE;
    
    // Get app handle for async operations
    let app_handle = match INPUT_APP_HANDLE.get() {
        Some(handle) => handle.clone(),
        None => {
            #[cfg(debug_assertions)]
            println!("{}No app handle available for category search", get_tracker_prefix());
            return;
        }
    };

    // Wait briefly so the OS can finish updating the foreground window after UI actions
    // like taskbar minimize/restore or Alt+Tab. Input callbacks can fire before focus switches,
    // so without this we might read the previous window.
    wait_for_window_update();

    match get_active_window() {
        Ok(active_window) => {
            let current_window_id = active_window.window_id.to_string();
            let current_title = active_window.title.clone();
            let current_app_name = active_window.app_name.clone();
            let is_browser = is_browser_app(&active_window.app_name, &active_window.process_path);

            // Check what has changed
            let change_type = check_window_or_tab_changed(
                &current_window_id,
                &current_title,
                &current_app_name,
                is_browser,
            );

            // Determine if we should search for category (window change or tab change)
            let should_search_category = matches!(change_type, ChangeType::WindowChanged | ChangeType::TabChanged);

            // Extract domain for browser tabs
            let domain = if is_browser {
                extract_domain_from_browser_title(&current_title)
            } else {
                None
            };

            // Search directory and update category if window/tab changed
            if should_search_category {
                let app_name_clone = current_app_name.clone();
                let domain_clone = domain.clone();
                let app_handle_clone = app_handle.clone();
                
                // Spawn async task to search directory
                tauri::async_runtime::spawn(async move {
                    match search_app_directory(&app_handle_clone, &app_name_clone, domain_clone.as_deref()).await {
                        Ok(Some(category)) => {
                            // Update category in state
                            if let Ok(mut state) = app_handle_clone.state::<std::sync::Mutex<crate::modules::state::AppState>>().lock() {
                                state.current_app_category = Some(category.clone());
                                
                                // Record category change event
                                state.category_change_history.push(CategoryChangeEvent {
                                    category: category.clone(),
                                    timestamp: Instant::now(),
                                    app_name: app_name_clone.clone(),
                                });

                                // Prune old events (keep only last 2 minutes worth)
                                let cutoff = Instant::now().checked_sub(std::time::Duration::from_secs(120));
                                if let Some(cutoff_time) = cutoff {
                                    state.category_change_history.retain(|e| e.timestamp >= cutoff_time);
                                }

                                #[cfg(debug_assertions)]
                                println!(
                                    "{}Category updated to: '{}' for app '{}'",
                                    get_tracker_prefix(),
                                    category,
                                    app_name_clone
                                );
                            }
                        }
                        Ok(None) => {
                            // Not found, set to "Other"
                            if let Ok(mut state) = app_handle_clone.state::<std::sync::Mutex<crate::modules::state::AppState>>().lock() {
                                let category = "Other".to_string();
                                state.current_app_category = Some(category.clone());
                                
                                state.category_change_history.push(CategoryChangeEvent {
                                    category: category.clone(),
                                    timestamp: Instant::now(),
                                    app_name: app_name_clone.clone(),
                                });

                                // Prune old events
                                let cutoff = Instant::now().checked_sub(std::time::Duration::from_secs(120));
                                if let Some(cutoff_time) = cutoff {
                                    state.category_change_history.retain(|e| e.timestamp >= cutoff_time);
                                }
                            }
                        }
                        Err(_e) => {
                            #[cfg(debug_assertions)]
                            eprintln!(
                                "{}Failed to search app directory: {}",
                                get_tracker_prefix(),
                                _e
                            );
                            // On error, default to "Other"
                            if let Ok(mut state) = app_handle_clone.state::<std::sync::Mutex<crate::modules::state::AppState>>().lock() {
                                let category = "Other".to_string();
                                state.current_app_category = Some(category.clone());
                                
                                state.category_change_history.push(CategoryChangeEvent {
                                    category,
                                    timestamp: Instant::now(),
                                    app_name: app_name_clone.clone(),
                                });
                            }
                        }
                    }
                });
            }

            match change_type {
                ChangeType::WindowChanged => {
                    update_stored_window_info(&current_window_id, &current_title, &current_app_name, true);
                    #[cfg(debug_assertions)]
                    log_window_info(&active_window, true);
                }
                ChangeType::TabChanged => {
                    update_stored_window_info(&current_window_id, &current_title, &current_app_name, false);
                    #[cfg(debug_assertions)]
                    log_window_info(&active_window, false);
                }
                ChangeType::NoChange => {
                    // Still update the stored info in case title changed but we didn't detect it
                    // (e.g., page title updated without tab switch)
                    update_stored_window_info(&current_window_id, &current_title, &current_app_name, false);
                }
            }
        }
        Err(_e) => {
            #[cfg(debug_assertions)]
            println!(
                "{}Failed to get active window (if macOS, then grant screen recording permissions): {:?}",
                get_tracker_prefix(),
                _e
            );
        }
    }
}

/// Waits briefly for the OS to finish updating the foreground window.
///
/// After certain UI actions (e.g., taskbar minimize/restore, Alt+Tab, Win+<number>),
/// the OS may update the foreground window slightly after input callbacks fire.
/// The delay duration is configurable through app settings.
fn wait_for_window_update() {
    use super::callback::shared_utils::read_state;

    let delay_ms = read_state(|app_state| app_state.settings.window_update_delay_ms);
    std::thread::sleep(std::time::Duration::from_millis(delay_ms));
}

/// Logs the currently active window information to the console and updates the app state.
///
/// This function uses the `active-win-pos-rs` crate to get information about
/// the currently focused window and logs the application name to the console.
/// It also updates the active_window_id in the app state to track the current window.
/// This is useful for tracking user activity and understanding which applications
/// are being used during measurement periods.
///
/// ## Timing note
///
/// After certain UI actions (e.g., taskbar minimize/restore, Alt+Tab, Win+<number>),
/// the OS may update the foreground window slightly after input callbacks fire. This
/// function waits for a configurable delay (see app settings) before reading the
/// active window to avoid reading a stale (previous) window.
///
/// ## Platform Notes
///
/// **macOS**: Requires screen recording permissions to access window titles and app names.
/// The app must be granted these permissions in System Preferences > Security & Privacy > Privacy > Screen Recording.
///
/// Logs the active window asynchronously to avoid blocking the input callback thread.
///
/// This function spawns a background thread to handle the window logging with the
/// necessary delay, preventing UI glitches that can occur when blocking the input
/// callback thread (especially on Windows).
pub fn log_active_window_async() {
    std::thread::spawn(|| {
        log_active_window();
    });
}

/// Checks if the window or tab has changed compared to the stored state.
fn check_window_or_tab_changed(
    current_window_id: &str,
    current_title: &str,
    current_app_name: &str,
    is_browser: bool,
) -> ChangeType {
    use super::callback::shared_utils::read_state;

    let mut result = ChangeType::NoChange;
    
    read_state(|app_state| {
        let window_changed = app_state
            .active_window_id
            .as_ref()
            .map_or(true, |stored_id| stored_id != current_window_id);

        if window_changed {
            result = ChangeType::WindowChanged;
            return;
        }

        // Window ID is the same, check if title changed (tab change for browsers)
        let title_changed = app_state
            .active_window_title
            .as_ref()
            .map_or(true, |stored_title| stored_title != current_title);

        // Only consider it a tab change if:
        // 1. Title changed
        // 2. It's a browser app
        // 3. App name hasn't changed (still same browser)
        let app_name_same = app_state
            .active_app_name
            .as_ref()
            .map_or(true, |stored_app| stored_app == current_app_name);

        if title_changed && is_browser && app_name_same {
            result = ChangeType::TabChanged;
        } else if title_changed {
            // Title changed but not a browser or app changed - still update but don't count as tab change
            result = ChangeType::NoChange;
        }
    });
    
    result
}

/// Updates the stored window and tab information in the app state.
fn update_stored_window_info(
    window_id: &str,
    title: &str,
    app_name: &str,
    increment_change_count: bool,
) {
    use super::callback::shared_utils::modify_state;

    modify_state(|app_state| {
        app_state.active_window_id = Some(window_id.to_string());
        app_state.active_window_title = Some(title.to_string());
        app_state.active_app_name = Some(app_name.to_string());

        // Only increment window change count for actual window/app switches
        if increment_change_count {
            app_state.window_change_count += 1;
        }
    });
}

/// Logs the active window information to the console (debug builds only).
#[cfg(debug_assertions)]
fn log_window_info(active_window: &ActiveWindow, is_window_change: bool) {
    let change_type = if is_window_change {
        "Window/App"
    } else {
        "Tab"
    };

    println!(
        "{}Active {} changed to: '{}' from app '{}'\n   Process: {} (ID: {})\n   Position: x={}, y={}, width={}, height={}\n   Window ID: {}",
        get_tracker_prefix(),
        change_type,
        active_window.title,
        active_window.app_name,
        active_window.process_path.display(),
        active_window.process_id,
        active_window.position.x,
        active_window.position.y,
        active_window.position.width,
        active_window.position.height,
        active_window.window_id
    );
}
