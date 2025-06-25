use tauri_plugin_deep_link::DeepLinkExt;

mod functions;
use functions::{
    focus_main_window, get_running_apps, handle_deep_link, start_global_keystroke_listener,
};

pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    builder
        .invoke_handler(tauri::generate_handler![get_running_apps])
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(app);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
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

            // * Used for deeplinks at runtime for development
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
