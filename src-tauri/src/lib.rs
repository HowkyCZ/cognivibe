use std::sync::Mutex;
use tauri::Manager;

mod modules;

use modules::deeplinks::setup_deep_link_handlers;
use modules::settings::{load_settings_from_store, update_settings_cmd};
use modules::state::{get_measuring_state, get_settings_state, AppState};
use modules::tracker::{start_global_input_tracker, toggle_measuring};
#[cfg(not(debug_assertions))]
use modules::utils::focus_main_window;
#[cfg(debug_assertions)]
use modules::utils::{focus_main_window, get_init_prefix};

pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    builder
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            toggle_measuring,
            get_measuring_state,
            get_settings_state,
            update_settings_cmd
        ])
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus main window
            focus_main_window(app);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            println!("{}Starting Cognivibe application setup", get_init_prefix());

            // Autostart
            let _ = app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--flag1"]), /* arbitrary number of args to pass to your app */
            ));

            // Deep link setup
            if let Err(e) = setup_deep_link_handlers(app.handle()) {
                #[cfg(debug_assertions)]
                eprintln!("{}⚠️ Deep link setup failed: {}", get_init_prefix(), e);
            }

            // Load settings from store and initialize app state
            let app_state = app.state::<Mutex<AppState>>();

            // Load settings from store or use defaults
            let settings = load_settings_from_store(app.handle());

            // Update app state with loaded settings
            {
                let mut state = app_state.lock().unwrap();
                state.settings = settings.clone();

                // Auto-start measuring if configured
                if settings.should_autostart_measuring {
                    #[cfg(debug_assertions)]
                    println!(
                        "{}Auto-starting measurement as configured",
                        get_init_prefix()
                    );
                    state.is_measuring = true;
                    state.is_first_minute = true;
                }
            }

            // Check for updates (debug only)
            #[cfg(debug_assertions)]
            {
                use tauri_plugin_updater::UpdaterExt;
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    match handle.updater() {
                        Ok(updater) => match updater.check().await {
                            Ok(Some(update)) => {
                                println!(
                                    "{}Update available: version {} -> {}",
                                    get_init_prefix(),
                                    update.current_version,
                                    update.version
                                );
                            }
                            Ok(None) => {
                                println!("{}Application is up to date", get_init_prefix());
                            }
                            Err(e) => {
                                println!("{}Failed to check for updates: {}", get_init_prefix(), e);
                            }
                        },
                        Err(e) => {
                            println!("{}Failed to initialize updater: {}", get_init_prefix(), e);
                        }
                    }
                });
            }

            // Start global input tracker (this will handle all input events)
            #[cfg(debug_assertions)]
            println!("{}Starting global input tracker", get_init_prefix());
            start_global_input_tracker(app.handle().clone());

            #[cfg(debug_assertions)]
            println!(
                "{}Cognivibe application setup completed successfully",
                get_init_prefix()
            );

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
