use std::time::Duration;
use tauri::Emitter;
use tauri_plugin_notification::NotificationExt;

/// Debug command: after 5 seconds, sends a system notification and emits break-nudge.
/// Used for testing the notification bar flow.
#[tauri::command]
pub async fn trigger_debug_break_nudge(app: tauri::AppHandle) {
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        tauri::async_runtime::spawn_blocking(|| {
            std::thread::sleep(Duration::from_secs(5));
        })
        .await
        .ok();

        let _ = app_clone
            .notification()
            .builder()
            .title("CogniVibe")
            .body("Time for a break.")
            .show();

        let payload = serde_json::json!({
            "trigger_reason": "debug",
            "session_minutes": 90
        });
        let _ = app_clone.emit("break-nudge", payload);
    });
}

/// Debug command: after 5 seconds, sends a system notification and emits focus-nudge.
/// Used for testing the notification bar flow.
#[tauri::command]
pub async fn trigger_debug_focus_nudge(app: tauri::AppHandle) {
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        tauri::async_runtime::spawn_blocking(|| {
            std::thread::sleep(Duration::from_secs(5));
        })
        .await
        .ok();

        let _ = app_clone
            .notification()
            .builder()
            .title("CogniVibe")
            .body("Lots of context switching detected.")
            .show();

        let payload = serde_json::json!({
            "switching_count": 10,
            "window_minutes": 5
        });
        let _ = app_clone.emit("focus-nudge", payload);
    });
}
