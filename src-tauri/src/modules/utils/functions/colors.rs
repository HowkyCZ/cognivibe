#[cfg(debug_assertions)]
use owo_colors::OwoColorize;

/// Color utilities for logging across different modules
///
/// This module provides consistent color styling for console output across the application.
/// It uses a cohesive color scheme with custom colors for different modules:
/// - Tracker: Custom purple (#A07CEF)
/// - Settings: Orange (#FF8C00)
/// - Initialization: Blue (#007ACC)
/// - Utils: Green (#28A745)
/// - Deeplinks: Yellow (#FFD700)
///
/// # Features
/// - Custom hex color support for branding
/// - Consistent styling across all module logs
/// - Easy to modify color scheme in one location

/// Creates the Cognivibe tracker prefix with custom purple background (#A07CEF) and white bold text
#[cfg(debug_assertions)]
pub fn get_tracker_prefix() -> String {
    format!(
        "{} ",
        " Cognivibe: 🖲️ tracker "
            .bg_rgb::<160, 124, 239>() // #8C58EA
            .white()
            .bold()
    )
}

/// Creates the Cognivibe settings prefix with orange background (#FF8C00) and white bold text
#[cfg(debug_assertions)]
pub fn get_settings_prefix() -> String {
    format!(
        "{} ",
        " Cognivibe: ⚙️ settings "
            .bg_rgb::<255, 140, 0>() // #FF8C00
            .white()
            .bold()
    )
}

/// Creates the Cognivibe initialization prefix with blue background (#007ACC) and white bold text
#[cfg(debug_assertions)]
pub fn get_init_prefix() -> String {
    format!(
        "{} ",
        " Cognivibe: 🚀 init "
            .bg_rgb::<0, 122, 204>() // #007ACC
            .white()
            .bold()
    )
}

/// Creates the Cognivibe utils prefix with green background (#28A745) and white bold text
#[cfg(debug_assertions)]
pub fn get_utils_prefix() -> String {
    format!(
        "{} ",
        " Cognivibe: 🔧 utils "
            .bg_rgb::<40, 167, 69>() // #28A745
            .white()
            .bold()
    )
}

/// Creates the Cognivibe deeplinks prefix with yellow background (#FFD700) and white bold text
#[cfg(debug_assertions)]
pub fn get_deeplinks_prefix() -> String {
    format!(
        "{} ",
        " Cognivibe: 🔗 deeplinks "
            .bg_rgb::<255, 215, 0>() // #FFD700
            .white()
            .bold()
    )
}

/// Color scheme for tracker logging
#[cfg(debug_assertions)]
pub struct TrackerColors;

#[cfg(debug_assertions)]
impl TrackerColors {
    /// Returns the styled timestamp in cyan
    pub fn timestamp(text: &str) -> String {
        text.cyan().to_string()
    }
}
