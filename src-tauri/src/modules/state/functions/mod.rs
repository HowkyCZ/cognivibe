pub mod get_measuring_state;
pub mod get_settings_state;

// State-related functions are minimal since most functionality
// is handled by the respective domain modules (tracker, settings, etc.)
// This keeps the state module focused purely on state management
