pub mod types;
pub mod functions;

// Re-export types for convenience
pub use types::{MouseData, KeyboardData};

// Re-export commonly used functions
pub use functions::start_global_input_tracker::start_global_input_tracker;
pub use functions::toggle_measuring::toggle_measuring;
