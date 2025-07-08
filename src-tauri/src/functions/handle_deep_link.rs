use tauri::AppHandle;
use tauri_plugin_deep_link::DeepLinkExt;

use super::focus_main_window::focus_main_window;

// Unified function to set up deep link handling for the app
pub fn setup_deep_link_handlers(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Register deep link protocol
    app.deep_link().register("cognivibe")?;

    // Set up URL event handler
    let app_handle = app.clone();
    app.deep_link().on_open_url(move |event| {
        // Get all URLs first to avoid ownership issues
        let all_urls = event.urls();

        // Filter for cognivibe protocol URLs and take only the first one
        let cognivibe_url = all_urls
            .iter()
            .find(|url| url.as_str().starts_with("cognivibe://"))
            .map(|url| url.to_string());

        if let Some(url) = cognivibe_url {
            #[cfg(debug_assertions)]
            println!("Processing cognivibe deep link: {}", url);

            // Focus the main window
            focus_main_window(&app_handle);
        } else {
            #[cfg(debug_assertions)]
            println!("No cognivibe deep links found in: {:?}", all_urls);
        }
    });

    // Register all deep links for development (doesn't work on macOS)
    #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
    {
        app.deep_link().register_all()?;
    }

    Ok(())
}
