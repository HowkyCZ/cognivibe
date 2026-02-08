import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow, getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
import { currentMonitor } from "@tauri-apps/api/window";
import { useAppSettings } from "../hooks";

/** Check if a window with the given label already exists. */
async function windowExists(label: string): Promise<boolean> {
  try {
    const all = await getAllWebviewWindows();
    return all.some((w) => w.label === label);
  } catch {
    return false;
  }
}

interface BreakNudgePayload {
  trigger_reason: string;
  session_minutes: number;
}

interface FocusNudgePayload {
  switching_count: number;
  window_minutes: number;
}

interface BreakWarningAction {
  action: "start" | "skip";
}

interface FocusAction {
  action: "start" | "dismiss";
}

/**
 * Central coordinator for break and focus nudge windows.
 * Lives in the app root layout and listens for Tauri events.
 * Manages window lifecycle and prevents double-triggering.
 */
const BreakManager = () => {
  const { settings } = useAppSettings();
  const breakWarningRef = useRef<WebviewWindow | null>(null);
  const breakOverlayRef = useRef<WebviewWindow | null>(null);
  const focusNudgeRef = useRef<WebviewWindow | null>(null);
  const focusTimerRef = useRef<WebviewWindow | null>(null);
  // Track last nudge payload for passing to overlay
  const lastBreakPayload = useRef<BreakNudgePayload | null>(null);

  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    const setup = async () => {
      // Listen for break nudge events from Rust backend
      const unBreakNudge = await listen<BreakNudgePayload>(
        "break-nudge",
        (event) => {
          console.log("[BREAK_MANAGER] Received break-nudge:", event.payload);
          lastBreakPayload.current = event.payload;
          spawnBreakWarning(event.payload);
        }
      );
      unlisteners.push(unBreakNudge);

      // Listen for focus nudge events from Rust backend
      const unFocusNudge = await listen<FocusNudgePayload>(
        "focus-nudge",
        (event) => {
          console.log("[BREAK_MANAGER] Received focus-nudge:", event.payload);
          spawnFocusNudge(event.payload);
        }
      );
      unlisteners.push(unFocusNudge);

      // Listen for break warning actions (from warning window)
      const unBreakAction = await listen<BreakWarningAction>(
        "break-warning-action",
        async (event) => {
          console.log("[BREAK_MANAGER] Break warning action:", event.payload);
          if (event.payload.action === "start") {
            // Immediately close warning window before spawning overlay
            await closeBreakWarningWindow();
            spawnBreakOverlay();
          } else if (event.payload.action === "skip") {
            // Ensure warning window is closed on skip
            await closeBreakWarningWindow();
            // Cooldown is handled by Rust
          }
        }
      );
      unlisteners.push(unBreakAction);

      // Listen for focus actions (from nudge window)
      const unFocusAction = await listen<FocusAction>(
        "focus-action",
        async (event) => {
          console.log("[BREAK_MANAGER] Focus action:", event.payload);
          // Always close the nudge window on any action
          await closeFocusNudgeWindow();
          if (event.payload.action === "start") {
            startFocusSession();
          }
        }
      );
      unlisteners.push(unFocusAction);

      // Listen for break completion/skip (from overlay window)
      const unBreakCompleted = await listen("break-completed", () => {
        console.log("[BREAK_MANAGER] Break completed");
        breakOverlayRef.current = null;
      });
      unlisteners.push(unBreakCompleted);

      const unBreakSkipped = await listen("break-skipped", () => {
        console.log("[BREAK_MANAGER] Break skipped");
        breakOverlayRef.current = null;
      });
      unlisteners.push(unBreakSkipped);

      // Listen for focus session cancellation
      const unFocusCancelled = await listen("focus-session-cancelled", () => {
        console.log("[BREAK_MANAGER] Focus session cancelled");
        focusTimerRef.current = null;
      });
      unlisteners.push(unFocusCancelled);

      // Listen for focus session completion
      const unFocusComplete = await listen("focus-session-complete", () => {
        console.log("[BREAK_MANAGER] Focus session complete");
        focusTimerRef.current = null;
      });
      unlisteners.push(unFocusComplete);
    };

    setup();

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  /**
   * Nuke ALL windows with the given label. Destroys every window matching the label,
   * not just one. This handles the case where duplicate windows were created.
   * Calls the Rust-side force_destroy_window FIRST (most reliable — bypasses the
   * frozen popup JS entirely), then also tries JS-side close/destroy as belt-and-suspenders.
   */
  const nukeWindowByLabel = async (label: string) => {
    // Destroy ALL windows with this label (handle duplicates)
    let maxAttempts = 10; // Prevent infinite loops
    
    while (maxAttempts-- > 0) {
      // 1. Rust-side destroy — primary method, most reliable
      try {
        await invoke("force_destroy_window", { label });
      } catch {
        // may fail if window already gone — that's fine
      }

      // Small delay to let destroy propagate
      await new Promise(resolve => setTimeout(resolve, 50));

      // 2. JS-side close/destroy — belt-and-suspenders (destroy ALL matching windows)
      try {
        const all = await getAllWebviewWindows();
        const matching = all.filter((w) => w.label === label);
        if (matching.length > 0) {
          // Destroy ALL matching windows
          for (const win of matching) {
            try { await win.destroy(); } catch {}
            try { await win.close(); } catch {}
          }
        }
      } catch {
        // ignore
      }

      // Check if any windows with this label still exist
      await new Promise(resolve => setTimeout(resolve, 50));
      try {
        const allAfter = await getAllWebviewWindows();
        const stillExists = allAfter.some((w) => w.label === label);
        if (!stillExists) {
          // All windows destroyed, we're done
          break;
        }
      } catch {
        // If we can't check, assume done after one attempt
        break;
      }
    }
  };

  /** Close the break warning window aggressively. */
  const closeBreakWarningWindow = async () => {
    breakWarningRef.current = null;
    await nukeWindowByLabel("break-warning");
  };

  /** Close the focus nudge window aggressively. */
  const closeFocusNudgeWindow = async () => {
    focusNudgeRef.current = null;
    await nukeWindowByLabel("focus-nudge");
  };

  /** Get top-right screen coordinates for a popup of the given size. */
  const getTopRightPosition = async (winWidth: number, _winHeight: number) => {
    try {
      const monitor = await currentMonitor();
      if (monitor) {
        const scale = monitor.scaleFactor;
        const screenW = monitor.size.width / scale;
        const padding = 20;
        return {
          x: Math.round(screenW - winWidth - padding),
          y: Math.round(padding),
        };
      }
    } catch {
      // Fallback: let Tauri decide
    }
    return undefined;
  };

  const spawnBreakWarning = async (payload: BreakNudgePayload) => {
    // CRITICAL: Destroy any existing windows FIRST to prevent duplicates
    await nukeWindowByLabel("break-warning");
    await nukeWindowByLabel("break-overlay");
    
    // Don't spawn if already showing or window already exists (double-check after nuke)
    if (breakWarningRef.current || breakOverlayRef.current) return;
    if (await windowExists("break-warning") || await windowExists("break-overlay")) return;

    const winW = 410;
    const winH = 148;
    const pos = await getTopRightPosition(winW, winH);

    const url = `/break-warning?reason=${payload.trigger_reason}&minutes=${payload.session_minutes}`;
    const win = new WebviewWindow("break-warning", {
      url,
      title: "",
      width: winW,
      height: winH,
      alwaysOnTop: true,
      decorations: false,
      resizable: false,
      transparent: false,
      focus: true,
      ...(pos ? { x: pos.x, y: pos.y } : {}),
    });

    win.once("tauri://error", (e) => {
      console.error("[BREAK_MANAGER] Break warning window error:", e);
      breakWarningRef.current = null;
    });
    win.once("tauri://destroyed", () => {
      breakWarningRef.current = null;
    });

    breakWarningRef.current = win;
  };

  const spawnBreakOverlay = async () => {
    // Ensure warning window is closed (should already be closed by event handler, but double-check)
    await closeBreakWarningWindow();

    // Don't double-spawn
    if (breakOverlayRef.current) return;
    if (await windowExists("break-overlay")) return;

    const payload = lastBreakPayload.current;
    const sessionInfo = await getSessionInfo();
    const sessionId = sessionInfo?.session_id || "";
    const sessionMinutes = payload?.session_minutes || 90;
    const reason = payload?.trigger_reason || "long_session";
    const duration = settings?.break_duration_seconds || 120;

    // Capture screenshot before opening overlay
    let screenshotPath = "";
    try {
      screenshotPath = await invoke<string>("capture_screen");
    } catch (e) {
      console.warn("[BREAK_MANAGER] Screenshot capture failed, using gradient fallback:", e);
    }

    const url = `/break?reason=${reason}&minutes=${sessionMinutes}&sessionId=${sessionId}&duration=${duration}&screenshot=${encodeURIComponent(screenshotPath)}`;
    const win = new WebviewWindow("break-overlay", {
      url,
      title: "Break",
      fullscreen: true,
      alwaysOnTop: true,
      decorations: false,
      resizable: false,
    });

    win.once("tauri://error", (e) => {
      console.error("[BREAK_MANAGER] Break overlay error:", e);
      breakOverlayRef.current = null;
    });
    win.once("tauri://destroyed", () => {
      breakOverlayRef.current = null;
    });

    breakOverlayRef.current = win;
  };

  const spawnFocusNudge = async (payload: FocusNudgePayload) => {
    // CRITICAL: Destroy any existing windows FIRST to prevent duplicates
    await nukeWindowByLabel("focus-nudge");
    
    // Don't spawn if already showing a nudge or overlay (double-check after nuke)
    if (focusNudgeRef.current || breakOverlayRef.current) return;
    if (await windowExists("focus-nudge")) return;

    const winW = 380;
    const winH = 140;
    const pos = await getTopRightPosition(winW, winH);

    const url = `/focus-nudge?switches=${payload.switching_count}&minutes=${payload.window_minutes}`;
    const win = new WebviewWindow("focus-nudge", {
      url,
      title: "",
      width: winW,
      height: winH,
      alwaysOnTop: true,
      decorations: false,
      resizable: false,
      transparent: false,
      focus: false,
      ...(pos ? { x: pos.x, y: pos.y } : {}),
    });

    win.once("tauri://error", (e) => {
      console.error("[BREAK_MANAGER] Focus nudge window error:", e);
      focusNudgeRef.current = null;
    });
    win.once("tauri://destroyed", () => {
      focusNudgeRef.current = null;
    });

    focusNudgeRef.current = win;
  };

  const startFocusSession = async () => {
    // Ensure nudge window is closed before starting session
    await closeFocusNudgeWindow();

    try {
      // Start the focus session in the Rust backend (25 min default)
      await invoke("start_focus_session", { durationSecs: 25 * 60 });

      // Spawn the focus timer widget at top-right
      if (!focusTimerRef.current && !(await windowExists("focus-timer"))) {
        const timerW = 220;
        const timerH = 44;
        const timerPos = await getTopRightPosition(timerW, timerH);

        const win = new WebviewWindow("focus-timer", {
          url: "/focus-timer",
          title: "",
          width: timerW,
          height: timerH,
          alwaysOnTop: true,
          decorations: false,
          resizable: false,
          transparent: false,
          focus: false,
          ...(timerPos ? { x: timerPos.x, y: timerPos.y } : {}),
        });

        win.once("tauri://error", (e) => {
          console.error("[BREAK_MANAGER] Focus timer window error:", e);
          focusTimerRef.current = null;
        });
        win.once("tauri://destroyed", () => {
          focusTimerRef.current = null;
        });

        focusTimerRef.current = win;
      }
    } catch (error) {
      console.error("[BREAK_MANAGER] Failed to start focus session:", error);
    }
  };

  return null; // This component only handles events, no UI
};

async function getSessionInfo(): Promise<{ elapsed_ms: number; session_id: string } | null> {
  try {
    return await invoke<{ elapsed_ms: number; session_id: string } | null>(
      "get_session_info"
    );
  } catch {
    return null;
  }
}

export default BreakManager;
