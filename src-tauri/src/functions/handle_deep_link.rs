use tauri::{AppHandle, Emitter};

use super::focus_main_window::focus_main_window;

pub fn handle_deep_link(app: &AppHandle, urls: Vec<String>) {
    println!("Received deep links: {:?}", urls);

    // Focus the main window
    focus_main_window(app);

    // Emit the deep links to the frontend
    let _ = app.emit("deep-links", urls);
}
