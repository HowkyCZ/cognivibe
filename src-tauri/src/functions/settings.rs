use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

// Application settings
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub should_start_on_boot: bool,
    pub should_autostart_measuring: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            should_start_on_boot: true,
            should_autostart_measuring: true,
        }
    }
}

use crate::AppState;

#[tauri::command]
/// Retrieves the current application settings.
///
/// This Tauri command returns a copy of the current app settings
/// including preferences like should_start_on_boot and should_autostart_measuring.
/// Used by the frontend to display current settings in the UI.
///
/// # Arguments
/// * `state` - The global app state containing current settings
///
/// # Returns
/// A clone of the current AppSettings structure
pub fn get_settings_cmd(state: State<'_, Mutex<AppState>>) -> AppSettings {
    let state = state.lock().unwrap();
    state.settings.clone()
}

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
    }

    // Save settings to store
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;
    store.set("app_settings", serde_json::to_value(settings).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

/// Loads application settings from persistent storage.
///
/// This function attempts to load settings from the "settings.json" store file.
/// If no settings exist or there's an error loading them, it returns default
/// settings instead. This ensures the app always has valid settings to work with.
///
/// The loading process:
/// 1. Attempts to open the settings store
/// 2. Looks for the "app_settings" key
/// 3. Deserializes the JSON data into AppSettings
/// 4. Falls back to defaults if any step fails
///
/// # Arguments
/// * `app` - The Tauri app handle for accessing the store
///
/// # Returns
/// Either the loaded settings or default settings if loading fails
pub fn load_settings_from_store(app: &AppHandle) -> AppSettings {
    let store_result = app.store("settings.json");
    match store_result {
        Ok(store) => {
            match store.get("app_settings") {
                Some(value) => match serde_json::from_value::<AppSettings>(value) {
                    Ok(settings) => {
                        println!("Loaded settings from store: {:?}", settings);
                        settings
                    }
                    Err(e) => {
                        println!("Failed to parse settings, using defaults: {}", e);
                        AppSettings::default()
                    }
                },
                None => {
                    println!("No settings found, creating defaults");
                    let default_settings = AppSettings::default();
                    // Save default settings to store
                    store.set(
                        "app_settings",
                        serde_json::to_value(&default_settings).unwrap(),
                    );
                    let _ = store.save();
                    default_settings
                }
            }
        }
        Err(e) => {
            println!("Failed to get store, using defaults: {}", e);
            AppSettings::default()
        }
    }
}
