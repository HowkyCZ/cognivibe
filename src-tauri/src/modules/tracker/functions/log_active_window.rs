#[cfg(debug_assertions)]
use crate::modules::utils::get_tracker_prefix;
use active_win_pos_rs::{get_active_window, ActiveWindow};

fn log_active_window() {
    // Wait briefly so the OS can finish updating the foreground window after UI actions
    // like taskbar minimize/restore or Alt+Tab. Input callbacks can fire before focus switches,
    // so without this we might read the previous window.
    wait_for_window_update();

    match get_active_window() {
        Ok(active_window) => {
            let current_window_id = active_window.window_id.to_string();

            // Only proceed if the window has actually changed
            if has_window_changed(&current_window_id) {
                update_stored_window_id(current_window_id);

                #[cfg(debug_assertions)]
                log_window_info(&active_window);
            }
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            println!(
                "{}Failed to get active window (if macOS, then grant screen recording permissions): {:?}",
                get_tracker_prefix(),
                e
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

/// Checks if the window ID has changed compared to the stored state.
fn has_window_changed(current_window_id: &str) -> bool {
    use super::callback::shared_utils::read_state;

    read_state(|app_state| {
        app_state
            .active_window_id
            .as_ref()
            .map_or(true, |stored_id| stored_id != current_window_id)
    })
}

/// Updates the stored active window ID in the app state.
fn update_stored_window_id(window_id: String) {
    use super::callback::shared_utils::modify_state;

    modify_state(|app_state| {
        app_state.active_window_id = Some(window_id);
    });
}

/// Logs the active window information to the console (debug builds only).
#[cfg(debug_assertions)]
fn log_window_info(active_window: &ActiveWindow) {
    println!(
        "{}Active window updated to: '{}' from app '{}'\n   Process: {} (ID: {})\n   Position: x={}, y={}, width={}, height={}\n   Window ID: {}",
        get_tracker_prefix(),
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
