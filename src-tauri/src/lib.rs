use std::sync::Mutex;
use tauri::Manager;

mod functions;
mod state;

use functions::{
    focus_main_window, get_keyboard_data_cmd, get_mouse_data_cmd, get_mouse_distance_cmd,
    get_running_apps, get_settings_cmd, load_settings_from_store, reset_keyboard_tracking_cmd,
    reset_mouse_tracking_cmd, setup_deep_link_handlers, start_global_input_tracker,
    update_settings_cmd,
};
use state::{get_measuring_state, toggle_measuring, AppState};

pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    builder
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            get_running_apps,
            toggle_measuring,
            get_measuring_state,
            get_settings_cmd,
            update_settings_cmd,
            get_mouse_data_cmd,
            reset_mouse_tracking_cmd,
            get_keyboard_data_cmd,
            reset_keyboard_tracking_cmd,
            get_mouse_distance_cmd
        ])
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus main window
            focus_main_window(app);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Load settings from store and initialize app state
            let app_state = app.state::<Mutex<AppState>>();

            // Load settings from store or use defaults
            let settings = load_settings_from_store(app.handle());

            // Update app state with loaded settings
            {
                let mut state = app_state.lock().unwrap();
                state.settings = settings.clone();

                // Auto-start measuring if configured
                if settings.auto_start_measuring {
                    #[cfg(debug_assertions)]
                    println!("Auto-starting measurement as configured");
                    state.is_measuring = true;
                }
            }

            // Autostart
            let _ = app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
            ));

            // Deep link setup
            if let Err(e) = setup_deep_link_handlers(app.handle()) {
                eprintln!("⚠️ Deep link setup failed: {}", e);
                eprintln!("The app will continue without deep link support.");
                // Don't return the error - let the app continue
            }

            // Start global input tracker (this will handle all input events)
            start_global_input_tracker(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
