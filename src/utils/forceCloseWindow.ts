import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

/**
 * Forcefully closes the current window.
 * Uses the Rust-side force_destroy_window command FIRST (most reliable —
 * bypasses any frozen JS event loop), then falls back to JS close/destroy.
 */
export async function forceCloseWindow(): Promise<void> {
  const win = getCurrentWindow();
  const label = win.label;

  // 1. Rust-side destroy — primary, most reliable
  try {
    await invoke("force_destroy_window", { label });
    return;
  } catch (error) {
    console.warn("[FORCE_CLOSE] Rust force_destroy_window failed:", error);
  }

  // 2. JS destroy() — forceful
  try {
    await win.destroy();
    return;
  } catch (error) {
    console.warn("[FORCE_CLOSE] destroy() failed:", error);
  }

  // 3. JS close() — graceful
  try {
    await win.close();
    return;
  } catch (error) {
    console.warn("[FORCE_CLOSE] close() failed:", error);
  }

  // 4. Retry Rust after short delay
  await new Promise(resolve => setTimeout(resolve, 100));
  try {
    await invoke("force_destroy_window", { label });
  } catch (error) {
    console.error("[FORCE_CLOSE] All attempts failed for window:", label, error);
  }
}
