use super::shared_utils::modify_state;
use crate::modules::tracker::types::MouseSegment;
use std::time::Instant;

const SEGMENT_IDLE_MS: u128 = 150;

/// Average perpendicular distance from points to the straight line (start -> end), in pixels.
fn calc_deviation(start: &(f64, f64), end: &(f64, f64), points: &[(f64, f64)]) -> f64 {
    let (x1, y1) = *start;
    let (x2, y2) = *end;
    let line_len = ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt();
    if line_len < 1.0 {
        return 0.0;
    }
    let total: f64 = points
        .iter()
        .map(|(px, py)| ((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1).abs() / line_len)
        .sum();
    total / points.len() as f64
}

/// Backward movement (away from end point) in the last portion of the trajectory, in pixels.
fn calc_overshoot(points: &[(f64, f64)]) -> f64 {
    if points.len() < 5 {
        return 0.0;
    }
    let end = points.last().unwrap();
    let check_count = std::cmp::max(3, points.len() / 5);
    let start_idx = points.len() - check_count;
    let mut reversal = 0.0;
    for i in start_idx..points.len().saturating_sub(1) {
        let d1 = ((points[i].0 - end.0).powi(2) + (points[i].1 - end.1).powi(2)).sqrt();
        let d2 = ((points[i + 1].0 - end.0).powi(2) + (points[i + 1].1 - end.1).powi(2)).sqrt();
        if d2 > d1 {
            reversal += d2 - d1;
        }
    }
    reversal
}

/// Finalize a mouse segment and add its deviation/overshoot to mouse_data sums.
/// Call this when a segment ends (e.g. at minute boundary) to include it in the current minute.
pub fn finalize_mouse_segment(seg: MouseSegment, mouse_data: &mut crate::modules::tracker::types::MouseData) {
    if seg.points.len() >= 5 {
        let end = *seg.points.last().unwrap();
        let dist = ((end.0 - seg.start.0).powi(2) + (end.1 - seg.start.1).powi(2)).sqrt();
        if dist >= 20.0 {
            let deviation = calc_deviation(&seg.start, &end, &seg.points);
            let overshoot = calc_overshoot(&seg.points);
            mouse_data.deviation_sum += deviation;
            mouse_data.overshoot_sum += overshoot;
            mouse_data.segment_count += 1;
        }
    }
}

/// Handle mouse movement events with gating
/// Events within 200ms are counted as a single move event (for active_sd calculation)
/// Distance tracking is always updated regardless of gating
pub fn handle_mouse_move(x: f64, y: f64) {
    modify_state(|state| {
        let mouse_data = &mut state.mouse_data;
        let now = Instant::now();
        let gating_window_ms = 200; // 200ms gating window

        // Check if this event should be counted (gating logic)
        let should_count = match state.last_mouse_move_time {
            Some(last_time) => {
                // Count if enough time has passed since last event
                now.duration_since(last_time).as_millis() >= gating_window_ms as u128
            }
            None => {
                // First event, always count
                true
            }
        };

        if should_count {
            // Increment move events counter (for active_sd calculation)
            mouse_data.move_events += 1;
            state.last_mouse_move_time = Some(now);
        }
        // If gated, ignore this event for counting (don't update timestamp)
        // Distance calculation continues regardless of gating

        // Calculate distance if we have a previous position
        // Always update distance, regardless of gating
        if mouse_data.last_x != 0.0 || mouse_data.last_y != 0.0 {
            let dx = x - mouse_data.last_x;
            let dy = y - mouse_data.last_y;
            let distance = (dx * dx + dy * dy).sqrt();
            
            // Apply resolution multiplier if available
            let normalized_distance = if let Some(multiplier) = state.screen_resolution_multiplier {
                distance * multiplier
            } else {
                distance
            };
            
            mouse_data.total_distance += normalized_distance;
        }

        // Update last position (always, regardless of gating)
        mouse_data.last_x = x;
        mouse_data.last_y = y;

        // Movement segmentation for deviation/overshoot
        let is_new_segment = match mouse_data.last_segment_time {
            Some(t) => now.duration_since(t).as_millis() >= SEGMENT_IDLE_MS,
            None => true,
        };

        if is_new_segment {
            if let Some(seg) = mouse_data.current_segment.take() {
                if seg.points.len() >= 5 {
                    let end = *seg.points.last().unwrap();
                    let dist =
                        ((end.0 - seg.start.0).powi(2) + (end.1 - seg.start.1).powi(2)).sqrt();
                    if dist >= 20.0 {
                        let deviation = calc_deviation(&seg.start, &end, &seg.points);
                        let overshoot = calc_overshoot(&seg.points);
                        mouse_data.deviation_sum += deviation;
                        mouse_data.overshoot_sum += overshoot;
                        mouse_data.segment_count += 1;
                    }
                }
            }
            mouse_data.current_segment = Some(MouseSegment {
                start: (x, y),
                points: vec![(x, y)],
            });
        } else if let Some(ref mut seg) = mouse_data.current_segment {
            seg.points.push((x, y));
        }
        mouse_data.last_segment_time = Some(now);
    });
}
