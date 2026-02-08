import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor } from "@tauri-apps/api/window";
import { useAppSettings } from "../hooks";

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
        (event) => {
          console.log("[BREAK_MANAGER] Break warning action:", event.payload);
          if (event.payload.action === "start") {
            spawnBreakOverlay();
          }
          // "skip" just means the warning closed, cooldown is handled by Rust
        }
      );
      unlisteners.push(unBreakAction);

      // Listen for focus actions (from nudge window)
      const unFocusAction = await listen<FocusAction>(
        "focus-action",
        (event) => {
          console.log("[BREAK_MANAGER] Focus action:", event.payload);
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

  /** Get top-right screen coordinates for a popup of the given size. */
  const getTopRightPosition = async (winWidth: number, winHeight: number) => {
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
    // Don't spawn if already showing
    if (breakWarningRef.current || breakOverlayRef.current) return;

    const winW = 400;
    const winH = 140;
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
      transparent: true,
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
    // Close the warning window if still open
    if (breakWarningRef.current) {
      try {
        await breakWarningRef.current.close();
      } catch { /* already closed */ }
      breakWarningRef.current = null;
    }

    // Don't double-spawn
    if (breakOverlayRef.current) return;

    const payload = lastBreakPayload.current;
    const sessionInfo = await getSessionInfo();
    const sessionId = sessionInfo?.session_id || "";
    const sessionMinutes = payload?.session_minutes || 90;
    const reason = payload?.trigger_reason || "long_session";
    const duration = settings?.break_duration_seconds || 120;

    const url = `/break?reason=${reason}&minutes=${sessionMinutes}&sessionId=${sessionId}&duration=${duration}`;
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
    // Don't spawn if already showing a nudge or overlay
    if (focusNudgeRef.current || breakOverlayRef.current) return;

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
      transparent: true,
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
    try {
      // Start the focus session in the Rust backend (25 min default)
      await invoke("start_focus_session", { durationSecs: 25 * 60 });

      // Spawn the focus timer widget
      if (!focusTimerRef.current) {
        const win = new WebviewWindow("focus-timer", {
          url: "/focus-timer",
          title: "",
          width: 220,
          height: 50,
          alwaysOnTop: true,
          decorations: false,
          resizable: false,
          transparent: true,
          focus: false,
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
