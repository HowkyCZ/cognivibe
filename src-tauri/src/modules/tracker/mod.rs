pub mod functions;
pub mod types;

// Re-export types for convenience
pub use types::{KeyboardData, MouseData};

// Re-export commonly used functions
pub use functions::get_is_measuring::get_is_measuring;
pub use functions::log_active_window::log_active_window;
pub use functions::start_global_input_tracker::start_global_input_tracker;
pub use functions::toggle_measuring::toggle_measuring;
