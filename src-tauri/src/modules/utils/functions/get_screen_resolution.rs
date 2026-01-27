/// Calculate screen resolution multiplier for mouse distance normalization
///
/// Formula: m = (diag_ref / diag_cur)^q
/// where:
/// - diag_ref = √(1920² + 1080²) = 2202.91 (reference diagonal from training dataset)
/// - diag_cur = √(w² + h²) (current screen diagonal)
/// - q = 2 (exponent for better fit to training data)
///
/// Returns None if resolution cannot be determined
pub fn calculate_resolution_multiplier() -> Option<f64> {
    // Try to get display size using rdev
    match rdev::display_size() {
        Ok((width, height)) => {
            let diag_ref = (1920.0 * 1920.0 + 1080.0 * 1080.0).sqrt(); // 2202.91
            let diag_cur = ((width as f64) * (width as f64) + (height as f64) * (height as f64)).sqrt();
            let q = 2.0;
            let multiplier = (diag_ref / diag_cur).powf(q);
            Some(multiplier)
        }
        Err(_) => {
            // If we can't get resolution, return None (will use unnormalized distance)
            None
        }
    }
}
