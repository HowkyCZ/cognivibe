use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use super::super::types::AppSettings;
#[cfg(debug_assertions)]
use crate::modules::utils::get_settings_prefix;

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
                        #[cfg(debug_assertions)]
                        println!("{}Loaded settings from store: {:?}", get_settings_prefix(), settings);
                        settings
                    }
                    Err(_e) => {
                        #[cfg(debug_assertions)]
                        println!("{}Failed to parse settings, using defaults: {}", get_settings_prefix(), _e);
                        AppSettings::default()
                    }
                },
                None => {
                    #[cfg(debug_assertions)]
                    println!("{}No settings found, creating defaults", get_settings_prefix());
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
        Err(_e) => {
            #[cfg(debug_assertions)]
            println!("{}Failed to get store, using defaults: {}", get_settings_prefix(), _e);
            AppSettings::default()
        }
    }
}
