use tauri::AppHandle;
use tauri_plugin_deep_link::DeepLinkExt;

use crate::modules::utils::focus_main_window;

/// Sets up deep link handling for the Cognivibe application.
/// 
/// This function:
/// - Registers the "cognivibe://" protocol with the system
/// - Sets up event handlers for when deep links are opened
/// - Automatically focuses the main window when a deep link is activated
/// 
/// Deep links allow external applications or websites to open and interact
/// with Cognivibe directly. When a cognivibe:// URL is opened, this handler
/// will bring the app to the foreground for the user.
/// 
/// # Arguments
/// * `app` - Reference to the Tauri app handle for accessing deep link functionality
/// 
/// # Returns
/// * `Ok(())` if setup was successful
/// * `Err(...)` if there was an error registering the protocol or setting up handlers
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
