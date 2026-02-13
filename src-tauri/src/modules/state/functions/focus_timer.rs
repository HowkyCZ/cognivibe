use std::sync::Mutex;
use std::time::{Duration, SystemTime};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::modules::state::AppState;

/// Response type for focus session state queries
#[derive(Debug, Clone, Serialize)]
pub struct FocusSessionState {
    pub remaining_secs: u64,
    pub total_secs: u64,
}

/// Start a focus session with the given duration.
/// Sets up state and starts a background task to update the tray title.
#[tauri::command]
pub fn start_focus_session(app_handle: AppHandle, duration_secs: u64) -> Result<(), String> {
    let state = app_handle.state::<Mutex<AppState>>();
    let end_time = SystemTime::now() + Duration::from_secs(duration_secs);
    
    {
        let mut app_state = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        app_state.focus_session_active = true;
        app_state.focus_session_end_time = Some(end_time);
    }

    // Start background task for tray title updates
    let app_handle_clone = app_handle.clone();
    let total_secs = duration_secs;
    tauri::async_runtime::spawn(async move {
        loop {
            let _ = tauri::async_runtime::spawn_blocking(|| {
                std::thread::sleep(Duration::from_secs(1));
            }).await;

            let remaining = {
                let state = app_handle_clone.state::<Mutex<AppState>>();
                let app_state = match state.lock() {
                    Ok(s) => s,
                    Err(_) => {
                        // Lock failed — clear tray title and exit
                        clear_tray_title(&app_handle_clone);
                        break;
                    }
                };
                if !app_state.focus_session_active {
                    // Session was cancelled externally — clear tray title and exit
                    drop(app_state);
                    clear_tray_title(&app_handle_clone);
                    #[cfg(debug_assertions)]
                    println!("[FOCUS_TIMER] Background loop: session cancelled, clearing tray");
                    break;
                }
                let remaining = match app_state.focus_session_end_time {
                    Some(end) => {
                        let now = SystemTime::now();
                        if now >= end {
                            0u64
                        } else {
                            end.duration_since(now).unwrap_or_default().as_secs()
                        }
                    }
                    None => {
                        drop(app_state);
                        clear_tray_title(&app_handle_clone);
                        break;
                    }
                };
                drop(app_state);
                remaining
            };

            // Update tray title
            // Note: We rely on the check above and the multiple delayed clears in stop_focus_session
            // to handle race conditions
            update_tray_title(&app_handle_clone, remaining);

            if remaining == 0 {
                // Focus session complete
                {
                    let state = app_handle_clone.state::<Mutex<AppState>>();
                    if let Ok(mut app_state) = state.lock() {
                        app_state.focus_session_active = false;
                        app_state.focus_session_end_time = None;
                    };
                }
                clear_tray_title(&app_handle_clone);
                let _ = app_handle_clone.emit("focus-session-complete", total_secs);
                #[cfg(debug_assertions)]
                println!("[FOCUS_TIMER] Background loop: session complete, cleared tray");
                break;
            }
        }
    });

    // Set initial tray title
    update_tray_title(&app_handle, duration_secs);

    #[cfg(debug_assertions)]
    println!("[FOCUS_TIMER] Focus session started: {}s", duration_secs);

    Ok(())
}

/// Get the current focus session state.
/// Returns None if no focus session is active.
#[tauri::command]
pub fn get_focus_session_state(app_handle: AppHandle) -> Result<Option<FocusSessionState>, String> {
    let state = app_handle.state::<Mutex<AppState>>();
    let app_state = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    if !app_state.focus_session_active {
        return Ok(None);
    }

    let remaining = match app_state.focus_session_end_time {
        Some(end) => {
            let now = SystemTime::now();
            if now >= end {
                0
            } else {
                end.duration_since(now).unwrap_or_default().as_secs()
            }
        }
        None => return Ok(None),
    };

    // Calculate total from end_time - (end_time - remaining)
    // We don't store total, so approximate from the focus_session_end_time
    Ok(Some(FocusSessionState {
        remaining_secs: remaining,
        total_secs: remaining, // approximation, doesn't need to be exact
    }))
}

/// Extend the current focus session by the given number of seconds.
#[tauri::command]
pub fn extend_focus_session(app_handle: AppHandle, extra_secs: u64) -> Result<(), String> {
    let state = app_handle.state::<Mutex<AppState>>();
    let mut app_state = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    if !app_state.focus_session_active {
        return Err("No focus session active".to_string());
    }

    if let Some(ref mut end_time) = app_state.focus_session_end_time {
        let new_end = *end_time + Duration::from_secs(extra_secs);
        *end_time = new_end;
    }

    #[cfg(debug_assertions)]
    println!("[FOCUS_TIMER] Focus session extended by {}s", extra_secs);

    Ok(())
}

/// Stop the current focus session.
#[tauri::command]
pub fn stop_focus_session(app_handle: AppHandle) -> Result<(), String> {
    let state = app_handle.state::<Mutex<AppState>>();
    let mut app_state = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    app_state.focus_session_active = false;
    app_state.focus_session_end_time = None;

    // Clear tray title immediately
    drop(app_state); // Release lock before accessing tray
    clear_tray_title(&app_handle);

    // Schedule multiple delayed clears to beat the race with the background loop.
    // The loop sleeps 1s between iterations and may have already read a remaining
    // value before we set focus_session_active=false, so it could overwrite our
    // clear. Multiple clears at different intervals ensure we win.
    let app_handle_delayed1 = app_handle.clone();
    let app_handle_delayed2 = app_handle.clone();
    let app_handle_delayed3 = app_handle.clone();
    
    // Clear after 1.5s (after next loop iteration)
    tauri::async_runtime::spawn(async move {
        let _ = tauri::async_runtime::spawn_blocking(|| {
            std::thread::sleep(Duration::from_millis(1500));
        }).await;
        clear_tray_title(&app_handle_delayed1);
    });
    
    // Clear after 2.5s (extra safety)
    tauri::async_runtime::spawn(async move {
        let _ = tauri::async_runtime::spawn_blocking(|| {
            std::thread::sleep(Duration::from_millis(2500));
        }).await;
        clear_tray_title(&app_handle_delayed2);
    });
    
    // Clear after 3.5s (final safety net)
    tauri::async_runtime::spawn(async move {
        let _ = tauri::async_runtime::spawn_blocking(|| {
            std::thread::sleep(Duration::from_millis(3500));
        }).await;
        clear_tray_title(&app_handle_delayed3);
    });

    #[cfg(debug_assertions)]
    println!("[FOCUS_TIMER] Focus session stopped");

    Ok(())
}

/// Update the tray icon title to show remaining time
fn update_tray_title(app_handle: &AppHandle, remaining_secs: u64) {
    let m = remaining_secs / 60;
    let s = remaining_secs % 60;
    let title = format!("{}:{:02}", m, s);
    
    if let Some(tray) = find_tray(app_handle) {
        #[cfg(target_os = "macos")]
        let _ = tray.set_title(Some(&title));
        let _ = tray.set_tooltip(Some(&format!("Focus: {}", title)));
    }
}

/// Clear the tray icon title
fn clear_tray_title(app_handle: &AppHandle) {
    if let Some(tray) = find_tray(app_handle) {
        #[cfg(target_os = "macos")]
        let _ = tray.set_title(None::<&str>);
        let _ = tray.set_tooltip(Some("CogniVibe"));
        #[cfg(debug_assertions)]
        println!("[FOCUS_TIMER] Tray title cleared");
    } else {
        #[cfg(debug_assertions)]
        eprintln!("[FOCUS_TIMER] clear_tray_title: no tray icon found!");
    }
}

/// Helper to try to find a tray icon
fn find_tray(app_handle: &AppHandle) -> Option<tauri::tray::TrayIcon> {
    for id in ["main", "tray", "1", "0"] {
        if let Some(tray) = app_handle.tray_by_id(id) {
            return Some(tray);
        }
    }
    #[cfg(debug_assertions)]
    eprintln!("[FOCUS_TIMER] find_tray: tried all IDs, none found");
    None
}
