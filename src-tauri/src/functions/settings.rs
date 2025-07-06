use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

// Application settings
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub start_on_boot: bool,
    pub auto_start_measuring: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            start_on_boot: true,
            auto_start_measuring: true,
        }
    }
}

use crate::AppState;

#[tauri::command]
pub fn get_settings_cmd(state: State<'_, Mutex<AppState>>) -> AppSettings {
    let state = state.lock().unwrap();
    state.settings.clone()
}

#[tauri::command]
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
