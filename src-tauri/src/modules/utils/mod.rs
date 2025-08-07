pub mod functions;
pub mod types;

// Re-export commonly used items for convenience
pub use functions::colors::{get_tracker_prefix, get_settings_prefix, get_init_prefix, get_utils_prefix, get_deeplinks_prefix, TrackerColors};
pub use functions::focus_main_window::focus_main_window;
