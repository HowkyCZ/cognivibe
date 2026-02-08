import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from "@tauri-apps/api/event";
import { IconX } from "@tabler/icons-react";

interface FocusSessionState {
  remaining_secs: number;
  total_secs: number;
}

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
    setTimeout(() => getCurrentWindow().close(), 150);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (completed) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center px-4"
        style={{ background: "#19141c" }}
      >
        <p className="text-[#ff709b] text-sm font-medium">
          Nice focus session!
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-between px-4"
      style={{ background: "#19141c" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#ff709b] animate-pulse" />
        <p className="text-[#ff709b] text-sm font-medium">
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
