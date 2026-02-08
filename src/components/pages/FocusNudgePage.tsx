import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { useSearch } from "@tanstack/react-router";
import { IconX } from "@tabler/icons-react";
import { forceCloseWindow } from "../../utils/forceCloseWindow";

const FocusNudgePage = () => {
  const search = useSearch({ strict: false }) as {
    switches?: string;
    minutes?: string;
  };
  const switches = parseInt(search.switches || "0", 10);
  const windowMinutes = parseInt(search.minutes || "5", 10);

  const [autoDismissLeft, setAutoDismissLeft] = useState(30);
  const isClosingRef = useRef(false);

  const doClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    forceCloseWindow().catch(() => {});
  }, []);

  // Esc key handler — works even if buttons are unresponsive
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("[FocusNudge] Esc pressed, force closing");
        doClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doClose]);

  // Auto-close timeout fallback (30 seconds max)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn("[FocusNudge] Auto-closing window after 30s timeout");
      doClose();
    }, 30 * 1000);

    return () => clearTimeout(timeout);
  }, [doClose]);

  // Auto-dismiss countdown (30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoDismissLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isClosingRef.current) {
            isClosingRef.current = true;
            emit("focus-action", { action: "dismiss" })
              .then(() => forceCloseWindow())
              .catch(() => forceCloseWindow());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartFocus = async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    try {
      await emit("focus-action", { action: "start" });
    } catch (error) {
      console.error("[FocusNudge] Error starting focus:", error);
    }
    await forceCloseWindow();
  };

  const handleDismiss = async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    try {
      await emit("focus-action", { action: "dismiss" });
    } catch (error) {
      console.error("[FocusNudge] Error dismissing:", error);
    }
    await forceCloseWindow();
  };

  const handleClose = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    await forceCloseWindow();
  }, []);

  // Native mousedown handler — fires before React's onPress and bypasses
  // any potential HeroUI event handling issues that cause stuck buttons
  const handleCloseMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    },
    [handleClose]
  );

  return (
    <div
      className="h-screen w-screen flex flex-col items-start justify-center px-5 py-4 relative"
      style={{ background: "#19141c" }}
    >
      {/* Close button — onMouseDown fires even if onPress is stuck */}
      <button
        className="absolute top-2 right-2 text-white/30 hover:text-white/70 w-6 h-6 flex items-center justify-center rounded-md"
        style={{ zIndex: 9999, pointerEvents: "auto", background: "transparent", border: "none", cursor: "pointer" }}
        onMouseDown={handleCloseMouseDown}
        onDoubleClick={handleCloseMouseDown}
        title="Close"
      >
        <IconX size={14} />
      </button>

      <div className="flex flex-col gap-0 mb-1">
        <p className="text-white text-sm font-semibold">
          Lots of context switching
        </p>
        <p className="text-white/50 text-xs">
          {switches} switches in the last {windowMinutes} minutes
        </p>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button
          size="sm"
          className="bg-[#ff709b]/20 text-[#ff709b] text-xs font-semibold"
          onPress={handleStartFocus}
        >
          Start Focus Session
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="text-white/70 border-white/20 text-xs"
          onPress={handleDismiss}
        >
          Dismiss
        </Button>
      </div>

      {/* Auto-dismiss indicator */}
      <div className="w-full mt-3">
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ff709b]/30 rounded-full transition-all duration-1000"
            style={{ width: `${(autoDismissLeft / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default FocusNudgePage;
