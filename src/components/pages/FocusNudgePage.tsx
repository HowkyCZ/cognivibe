import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSearch } from "@tanstack/react-router";

const FocusNudgePage = () => {
  const search = useSearch({ strict: false }) as {
    switches?: string;
    minutes?: string;
  };
  const switches = parseInt(search.switches || "0", 10);
  const windowMinutes = parseInt(search.minutes || "5", 10);

  const [autoDismissLeft, setAutoDismissLeft] = useState(30);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoDismissLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          emit("focus-action", { action: "dismiss" });
          setTimeout(() => getCurrentWindow().close(), 150);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartFocus = async () => {
    await emit("focus-action", { action: "start" });
    setTimeout(() => getCurrentWindow().close(), 150);
  };

  const handleDismiss = async () => {
    await emit("focus-action", { action: "dismiss" });
    setTimeout(() => getCurrentWindow().close(), 150);
  };

  return (
    <div
      className="h-screen w-screen flex flex-col items-start justify-center px-5 py-4"
      style={{ background: "#19141c" }}
    >
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
