use serde::{Deserialize, Serialize};

/// Application settings structure containing user preferences
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    /// Whether the application should start automatically when the system boots
    pub should_start_on_boot: bool,
    /// Whether to automatically start measuring when the application launches
    pub should_autostart_measuring: bool,
    /// Delay in milliseconds to wait for the OS to finish updating the foreground window
    /// after UI actions like taskbar minimize/restore or Alt+Tab
    pub window_update_delay_ms: u64,
    /// Whether break nudges are enabled
    #[serde(default = "default_true")]
    pub break_nudge_enabled: bool,
    /// Minimum session duration in minutes before a break nudge triggers
    #[serde(default = "default_break_interval")]
    pub break_interval_minutes: u32,
    /// Break overlay duration in seconds
    #[serde(default = "default_break_duration")]
    pub break_duration_seconds: u32,
    /// Cognitive load score threshold for break nudge (3 consecutive intervals)
    #[serde(default = "default_break_score_threshold")]
    pub break_score_threshold: u32,
    /// App categories during which break nudges are automatically deferred
    #[serde(default = "default_auto_pause_categories")]
    pub break_auto_pause_categories: Vec<String>,
    /// Whether focus nudges are enabled
    #[serde(default = "default_true")]
    pub focus_nudge_enabled: bool,
    /// Multiplier over personal baseline for focus nudge trigger (e.g. 2.0 = 2x baseline)
    #[serde(default = "default_focus_sensitivity")]
    pub focus_nudge_sensitivity: f64,
}

fn default_true() -> bool { true }
fn default_break_interval() -> u32 { 90 }
fn default_break_duration() -> u32 { 120 }
fn default_break_score_threshold() -> u32 { 70 }
fn default_auto_pause_categories() -> Vec<String> {
    vec!["Meetings".to_string(), "Media and Entertainment".to_string()]
}
fn default_focus_sensitivity() -> f64 { 2.0 }

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            should_start_on_boot: true,
            should_autostart_measuring: true,
            window_update_delay_ms: 400,
            break_nudge_enabled: true,
            break_interval_minutes: 90,
            break_duration_seconds: 120,
            break_score_threshold: 70,
            break_auto_pause_categories: default_auto_pause_categories(),
            focus_nudge_enabled: true,
            focus_nudge_sensitivity: 2.0,
        }
    }
}
