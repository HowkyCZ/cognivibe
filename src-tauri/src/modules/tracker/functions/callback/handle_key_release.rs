use rdev::Key;

use super::super::start_global_input_tracker::MODIFIER_STATE;
use super::shared_utils::{modify_state, update_modifier_state};

/// Check if we should log the active window after key release
fn check_window_switch_completion(released_key: rdev::Key) {
    use super::super::log_active_window::log_active_window_async;

    if let Some(modifier_state) = MODIFIER_STATE.get() {
        if let Ok(mut state) = modifier_state.lock() {
            // Check if we had a window switch detected and if the key release completes it
            if state.window_switch_detected {
                let should_log = match released_key {
                    // For Alt+Tab combinations, log when Alt is released
                    rdev::Key::Alt => !state.alt_pressed,
                    // For Cmd combinations (macOS), log when Cmd is released
                    rdev::Key::MetaLeft | rdev::Key::MetaRight => {
                        #[cfg(target_os = "macos")]
                        {
                            !state.cmd_pressed
                        }
                        #[cfg(not(target_os = "macos"))]
                        {
                            !state.win_pressed
                        }
                    }
                    // For Ctrl+Tab combinations (browser tab switching), log when Ctrl is released
                    rdev::Key::ControlLeft | rdev::Key::ControlRight => {
                        !state.ctrl_pressed && state.window_switch_type.contains("browser tabs")
                    }
                    _ => false,
                };

                if should_log {
                    let switch_type = state.window_switch_type.clone();
                    state.window_switch_detected = false;
                    state.window_switch_type.clear();

                    // Log the window after a small delay to ensure the switch is complete
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        log_active_window_async();

                        #[cfg(debug_assertions)]
                        println!("🔄 {}", switch_type);
                    });
                }
            }
        }
    }
}

/// Handle key release events - update modifier states and track key statistics
pub fn handle_key_release(key: Key) {
    // Update modifier key states
    update_modifier_state(|state| match key {
        Key::ControlLeft | Key::ControlRight => state.ctrl_pressed = false,
        Key::ShiftLeft | Key::ShiftRight => state.shift_pressed = false,
        Key::Alt => state.alt_pressed = false,
        Key::MetaLeft | Key::MetaRight => {
            #[cfg(target_os = "macos")]
            {
                state.cmd_pressed = false;
            }
            #[cfg(not(target_os = "macos"))]
            {
                state.win_pressed = false;
            }
        }
        _ => {}
    });

    // Check if this key release completes a window switching shortcut
    check_window_switch_completion(key);

    // Track key statistics and dwell time
    modify_state(|state| {
        let key_id = format!("{:?}", key);
        if let Some(press_time) = state.keyboard_data.pending_key_presses.remove(&key_id) {
            let dwell_ms = press_time.elapsed().as_secs_f64() * 1000.0;
            if dwell_ms < 2000.0 {
                state.keyboard_data.dwell_time_sum_ms += dwell_ms;
                state.keyboard_data.dwell_time_count += 1;
            }
        }

        // Track delete key releases separately
        match key {
            Key::Backspace | Key::Delete => {
                state.keyboard_data.delete_ups += 1;
            }
            _ => {
                state.keyboard_data.key_ups += 1;
            }
        }
    });
}
