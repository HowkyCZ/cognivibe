use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_deep_link::DeepLinkExt;

mod functions;
use functions::{
    focus_main_window, get_running_apps, handle_deep_link, start_global_keystroke_listener,
};

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

// Application state to track measuring status
#[derive(Debug, Default)]
pub struct AppState {
    pub is_measuring: bool,
    pub settings: AppSettings,
}

#[tauri::command]
fn toggle_measuring(state: State<'_, Mutex<AppState>>) -> bool {
    let mut state = state.lock().unwrap();

    // Toggle the measuring state
    state.is_measuring = !state.is_measuring;

    if state.is_measuring {
        println!("Started measuring");
    } else {
        println!("Stopped measuring");
    }

    // Return the current measuring state
    state.is_measuring
}

#[tauri::command]
fn get_measuring_state(state: State<'_, Mutex<AppState>>) -> bool {
    let state = state.lock().unwrap();
    state.is_measuring
}

#[tauri::command]
fn get_settings(state: State<'_, Mutex<AppState>>) -> AppSettings {
    let state = state.lock().unwrap();
    state.settings.clone()
}

#[tauri::command]
fn update_settings(
    state: State<'_, Mutex<AppState>>,
    app: tauri::AppHandle,
    settings: AppSettings,
) -> Result<(), String> {
    {
        let mut app_state = state.lock().unwrap();
        app_state.settings = settings.clone();
    }

    // Save settings to store
    use tauri_plugin_store::StoreExt;
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;
    store.set("app_settings", serde_json::to_value(settings).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    builder
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            get_running_apps,
            toggle_measuring,
            get_measuring_state,
            get_settings,
            update_settings
        ])
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(app);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Load settings from store and initialize app state
            let app_state = app.state::<Mutex<AppState>>();

            // Load settings from store or use defaults
            use tauri_plugin_store::StoreExt;
            let store_result = app.store("settings.json");
            let settings = match store_result {
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
            };

            // Update app state with loaded settings
            {
                let mut state = app_state.lock().unwrap();
                state.settings = settings.clone();

                // Auto-start measuring if configured
                if settings.auto_start_measuring {
                    println!("Auto-starting measurement as configured");
                    state.is_measuring = true;
                }
            }

            #[cfg(desktop)]
            // Autostart
            let _ = app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
            ));

            // Deep link registration
            app.deep_link().register("cognivibe")?;

            let app_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls: Vec<String> = event.urls().iter().map(|url| url.to_string()).collect();
                handle_deep_link(&app_handle, urls);
            });

            // Start global keystroke listener
            start_global_keystroke_listener(app.handle().clone());

            // * Used for deeplinks at runtime for development, does not work on macos
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
