import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from "@tauri-apps/api/event";
import { IconX } from "@tabler/icons-react";

interface FocusSessionState {
  remaining_secs: u64;
  total_secs: u64;
}

type u64 = number;

const FocusTimerPage = () => {
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const state = await invoke<FocusSessionState | null>(
          "get_focus_session_state"
        );
        if (state) {
          setRemainingSecs(state.remaining_secs);
          if (state.remaining_secs <= 0) {
            setCompleted(true);
            clearInterval(interval);
            // Auto-close after 5 seconds
            setTimeout(() => {
              getCurrentWindow().close();
            }, 5000);
          }
        } else {
          // No active session, close
          getCurrentWindow().close();
        }
      } catch {
        // Command not yet available or errored
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    try {
      await invoke("stop_focus_session");
      await emit("focus-session-cancelled", {});
    } catch {
      // Ignore
    }
    getCurrentWindow().close();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (completed) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center px-4 rounded-2xl border border-white/10"
        style={{
          background: "rgba(25, 20, 28, 0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        <p className="text-primary-600 text-sm font-medium">
          Nice focus session!
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-between px-4 rounded-2xl border border-white/10"
      style={{
        background: "rgba(25, 20, 28, 0.92)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <p className="text-primary-700 text-sm font-medium">
          Focus: {remainingSecs !== null ? formatTime(remainingSecs) : "--:--"}
        </p>
      </div>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className="text-white/40 hover:text-white/80 min-w-6 w-6 h-6"
        onPress={handleCancel}
      >
        <IconX size={14} />
      </Button>
    </div>
  );
};

export default FocusTimerPage;
