use crate::functions::{reset_input_data, AppSettings, KeyboardData, MouseData};
use std::sync::Mutex;
use tauri::State;

// Application state to track measuring status
#[derive(Debug, Default)]
pub struct AppState {
    pub is_measuring: bool,
    pub settings: AppSettings,
    pub mouse_data: MouseData,
    pub keyboard_data: KeyboardData,
}

#[tauri::command]
pub fn toggle_measuring(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> bool {
    let is_starting_measurement;
    let current_state;

    {
        let mut app_state = state.lock().unwrap();
        // Toggle the measuring state
        app_state.is_measuring = !app_state.is_measuring;
        is_starting_measurement = app_state.is_measuring;
        current_state = app_state.is_measuring;
    }

    if is_starting_measurement {
        println!("Started measuring");
        // Reset mouse and keyboard tracking data when starting measurement
        reset_input_data(&app);
    } else {
        println!("Stopped measuring");
    }

    // Return the current measuring state
    current_state
}

#[tauri::command]
pub fn get_measuring_state(state: State<'_, Mutex<AppState>>) -> bool {
    let state = state.lock().unwrap();
    state.is_measuring
}
