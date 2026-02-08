import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { useSearch } from "@tanstack/react-router";
import { IconX } from "@tabler/icons-react";
import { forceCloseWindow } from "../../utils/forceCloseWindow";

const BreakWarningPage = () => {
  const search = useSearch({ strict: false }) as {
    reason?: string;
    minutes?: string;
  };
  const reason = search.reason || "long_session";
  const minutes = parseInt(search.minutes || "90", 10);

  // 2 minute countdown (120 seconds)
  const [secondsLeft, setSecondsLeft] = useState(120);
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
        console.log("[BreakWarning] Esc pressed, force closing");
        doClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doClose]);

  // Auto-close timeout fallback (5 minutes max)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn("[BreakWarning] Auto-closing window after 5 minute timeout");
      doClose();
    }, 5 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [doClose]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isClosingRef.current) {
            isClosingRef.current = true;
            emit("break-warning-action", { action: "start" })
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    try {
      await emit("break-warning-action", { action: "start" });
    } catch (error) {
      console.error("[BreakWarning] Error starting break:", error);
    }
    await forceCloseWindow();
  };

  const handleAddTime = () => {
    setSecondsLeft((prev) => prev + 60);
  };

  const handleSkip = async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    try {
      await emit("break-warning-action", { action: "skip" });
    } catch (error) {
      console.error("[BreakWarning] Error skipping break:", error);
    }
    await forceCloseWindow();
  };

  const handleClose = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    await forceCloseWindow();
  }, []);

  // Native mousedown handler — fires before React's onPress
  const handleCloseMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    },
    [handleClose]
  );

  const subtitle =
    reason === "high_cognitive_load"
      ? "Your cognitive load has been elevated"
      : `You've been working for ${minutes} minutes`;

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

      <div className="flex flex-col gap-0 mb-2">
        <p className="text-white text-sm font-semibold">
          Break in {formatTime(secondsLeft)}
        </p>
        <p className="text-white/50 text-xs">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button
          size="sm"
          className="bg-primary text-white text-xs font-semibold"
          onPress={handleStart}
        >
          Start now
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="text-white/70 border-white/20 text-xs"
          onPress={handleAddTime}
        >
          + 1 min
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="text-white/70 border-white/20 text-xs"
          onPress={handleSkip}
        >
          Skip
        </Button>
      </div>
    </div>
  );
};

export default BreakWarningPage;
