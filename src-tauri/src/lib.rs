use tauri_plugin_deep_link::DeepLinkExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Configure single instance plugin first (for desktop)
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, argv, _cwd| {
            println!("A new app instance was opened with {argv:?} and the deep link event was already triggered");
            // when defining deep link schemes at runtime, you must also check `argv` here
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Register deep links for development and ensure they work on installed apps
            #[cfg(any(windows, target_os = "linux"))]
            {
                app.deep_link().register_all()?;
            }

            // Register additional schemes at runtime if needed
            #[cfg(desktop)]
            {
                app.deep_link().register("cognivibe")?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
