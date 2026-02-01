use rdev::Key;

use super::super::start_global_input_tracker::MODIFIER_STATE;
use super::shared_utils::{modify_state, update_modifier_state};

/// Helper function to get modifier key states
fn get_modifier_state() -> (bool, bool, bool, bool, bool) {
    if let Some(modifier_state) = MODIFIER_STATE.get() {
        if let Ok(state) = modifier_state.lock() {
            return (
                state.ctrl_pressed,
                state.shift_pressed,
                state.alt_pressed,
                state.cmd_pressed,
                state.win_pressed,
            );
        }
    }
    (false, false, false, false, false)
}

/// Helper function to mark a window switch detection with a message
fn mark_window_switch(message: &str) {
    update_modifier_state(|state| {
        state.window_switch_detected = true;
        state.window_switch_type = message.to_string();
    });
}

/// Check for window switching shortcuts and mark them for later logging
fn check_window_switching_shortcuts(key: rdev::Key) {
    let (ctrl, shift, alt, cmd, win) = get_modifier_state();

    match key {
        rdev::Key::Tab => {
            if alt && shift {
                mark_window_switch("Alt+Shift+Tab detected - Switch apps in reverse order");
            } else if alt {
                mark_window_switch("Alt+Tab detected - Switch between applications");
            } else if cmd && shift {
                mark_window_switch("Cmd+Shift+Tab detected - Switch apps in reverse order (macOS)");
            } else if cmd {
                mark_window_switch("Cmd+Tab detected - Switch between applications (macOS)");
            } else if ctrl && alt {
                mark_window_switch("Ctrl+Alt+Tab detected - Keep Task Switcher open");
            } else if ctrl && shift {
                mark_window_switch("Ctrl+Shift+Tab detected - Switch browser tabs in reverse");
            } else if ctrl {
                mark_window_switch("Ctrl+Tab detected - Switch browser tabs");
            } else if win {
                mark_window_switch("Win+Tab detected - Open Task View (Windows)");
            }
        }
        rdev::Key::BackQuote => {
            if cmd && shift {
                mark_window_switch(
                    "Cmd+Shift+` detected - Switch windows within app in reverse (macOS)",
                );
            } else if cmd {
                mark_window_switch("Cmd+` detected - Switch windows within same app (macOS)");
            }
        }
        _ => {}
    }
}

/// Handle key press events - update modifier states and track key statistics
pub fn handle_key_press(key: Key) {
    // Update modifier key states
    update_modifier_state(|state| match key {
        Key::ControlLeft | Key::ControlRight => state.ctrl_pressed = true,
        Key::ShiftLeft | Key::ShiftRight => state.shift_pressed = true,
        Key::Alt => state.alt_pressed = true,
        Key::MetaLeft | Key::MetaRight => {
            #[cfg(target_os = "macos")]
            {
                state.cmd_pressed = true;
            }
            #[cfg(not(target_os = "macos"))]
            {
                state.win_pressed = true;
            }
        }
        _ => {}
    });

    // Check for window switching shortcuts
    check_window_switching_shortcuts(key);

    // Track key statistics and key press timestamp for dwell time
    modify_state(|state| {
        let key_id = format!("{:?}", key);
        state
            .keyboard_data
            .pending_key_presses
            .insert(key_id, std::time::Instant::now());

        // Track delete keys separately
        match key {
            Key::Backspace | Key::Delete => {
                state.keyboard_data.delete_downs += 1;
            }
            _ => {
                state.keyboard_data.key_downs += 1;
            }
        }
    });
}
