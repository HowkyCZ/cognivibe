use std::sync::Mutex;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

use super::super::types::AppSettings;
use crate::modules::state::AppState;
#[cfg(debug_assertions)]
use crate::modules::utils::get_settings_prefix;

#[tauri::command]
/// Updates the application settings and persists them to storage.
///
/// This Tauri command:
/// - Updates the global app state with new settings
/// - Saves the settings to persistent storage using Tauri's store plugin
/// - Ensures settings persist across app restarts
///
/// # Arguments
/// * `state` - The global app state to update
/// * `app` - The Tauri app handle for accessing the store
/// * `settings` - The new settings to apply and save
///
/// # Returns
/// * `Ok(())` if settings were successfully updated and saved
/// * `Err(String)` if there was an error saving to storage
pub fn update_settings_cmd(
    state: State<'_, Mutex<AppState>>,
    app: AppHandle,
    settings: AppSettings,
) -> Result<(), String> {
    {
        let mut app_state = state.lock().unwrap();
        app_state.settings = settings.clone();
        
        #[cfg(debug_assertions)]
        println!("{}Settings updated: {:?}", get_settings_prefix(), settings);
    }

    // Save settings to store
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;
    store.set("app_settings", serde_json::to_value(settings).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    #[cfg(debug_assertions)]
    println!("{}Settings saved to store successfully", get_settings_prefix());

    Ok(())
}
