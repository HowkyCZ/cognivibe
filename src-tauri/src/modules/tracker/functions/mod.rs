pub mod callback;
pub mod get_is_measuring;
pub mod log_active_window;
pub mod reset_input_data;
pub mod start_global_input_tracker;
pub mod start_minute_logger;
pub mod toggle_measuring;
pub mod upload_data;

// Re-export the input_callback from the callback module for backward compatibility
pub use callback::input_callback;
pub use upload_data::{upload_tracking_data, LogData};
