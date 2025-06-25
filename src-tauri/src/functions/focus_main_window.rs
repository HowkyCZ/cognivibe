use tauri::{AppHandle, Manager};

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
