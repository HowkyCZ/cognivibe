use tauri::{AppHandle, Manager};

/// Focuses the main application window, shows it if hidden, and unminimizes if minimized
pub fn focus_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
        let _ = window.show();
        let _ = window.unminimize();
    } else {
        println!("Main window not found");
        return;
    }
}
