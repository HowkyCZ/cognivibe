pub mod functions;
pub mod types;

// Re-export commonly used items for convenience
#[cfg(debug_assertions)]
pub use functions::colors::{
    get_deeplinks_prefix, get_init_prefix, get_settings_prefix, get_tracker_prefix,
    get_utils_prefix, TrackerColors,
};
pub use functions::focus_main_window::focus_main_window;
