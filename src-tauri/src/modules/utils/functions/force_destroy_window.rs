use tauri::{AppHandle, Manager};

/// Force-destroy a window by its label from the Rust side.
/// This is the nuclear option when the JS-side close()/destroy() calls
/// fail to work (e.g. due to event loop issues in popup windows).
#[tauri::command]
pub fn force_destroy_window(app_handle: AppHandle, label: String) -> Result<(), String> {
    #[cfg(debug_assertions)]
    println!("[FORCE_DESTROY] Attempting to destroy window: {}", label);

    if let Some(window) = app_handle.get_webview_window(&label) {
        window
            .destroy()
            .map_err(|e| format!("Failed to destroy window '{}': {}", label, e))?;

        #[cfg(debug_assertions)]
        println!("[FORCE_DESTROY] Successfully destroyed window: {}", label);

        Ok(())
    } else {
        #[cfg(debug_assertions)]
        println!("[FORCE_DESTROY] Window '{}' not found (already closed?)", label);

        // Not finding the window is fine — it may already be closed
        Ok(())
    }
}
