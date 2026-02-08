import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSearch } from "@tanstack/react-router";
import { IconX } from "@tabler/icons-react";

const BreakWarningPage = () => {
  const search = useSearch({ strict: false }) as {
    reason?: string;
    minutes?: string;
  };
  const reason = search.reason || "long_session";
  const minutes = parseInt(search.minutes || "90", 10);

  // 2 minute countdown (120 seconds)
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-start when countdown reaches 0
          emit("break-warning-action", { action: "start" }).then(() => {
            getCurrentWindow().close().catch(() => {});
          }).catch(() => {
            // Still try to close even if emit failed
            getCurrentWindow().close().catch(() => {});
          });
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
    try {
      await emit("break-warning-action", { action: "start" });
      // Close immediately - BreakManager will handle spawning the overlay
      await getCurrentWindow().close();
    } catch (error) {
      console.error("[BreakWarning] Error starting break:", error);
      // Still try to close even if emit failed
      try {
        await getCurrentWindow().close();
      } catch {}
    }
  };

  const handleAddTime = () => {
    setSecondsLeft((prev) => prev + 60);
  };

  const handleSkip = async () => {
    try {
      await emit("break-warning-action", { action: "skip" });
      await getCurrentWindow().close();
    } catch (error) {
      console.error("[BreakWarning] Error skipping break:", error);
      try {
        await getCurrentWindow().close();
      } catch {}
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (error) {
      console.error("[BreakWarning] Error closing window:", error);
    }
  };

  const subtitle =
    reason === "high_cognitive_load"
      ? "Your cognitive load has been elevated"
      : `You've been working for ${minutes} minutes`;

  return (
    <div
      className="h-screen w-screen flex flex-col items-start justify-center px-5 py-4 relative"
      style={{ background: "#19141c" }}
    >
      {/* Close button */}
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className="absolute top-2 right-2 text-white/30 hover:text-white/70 min-w-6 w-6 h-6"
        onPress={handleClose}
      >
        <IconX size={14} />
      </Button>

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
