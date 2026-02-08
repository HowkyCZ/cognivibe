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
          getCurrentWindow().close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartFocus = async () => {
    await emit("focus-action", { action: "start" });
    getCurrentWindow().close();
  };

  const handleDismiss = async () => {
    await emit("focus-action", { action: "dismiss" });
    getCurrentWindow().close();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black/0">
      <div
        className="w-full h-full flex flex-col items-start justify-center px-5 py-4 rounded-2xl border border-white/10"
        style={{
          background: "rgba(24, 24, 27, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
            <span className="text-teal-400 text-sm">CV</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              Lots of context switching
            </p>
            <p className="text-default-400 text-xs">
              {switches} switches in the last {windowMinutes} minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs"
            variant="bordered"
            onPress={handleStartFocus}
          >
            Start Focus Session
          </Button>
          <Button
            size="sm"
            variant="bordered"
            className="text-white border-white/20 text-xs"
            onPress={handleDismiss}
          >
            Dismiss
          </Button>
        </div>

        {/* Auto-dismiss indicator */}
        <div className="w-full mt-3">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500/30 rounded-full transition-all duration-1000"
              style={{ width: `${(autoDismissLeft / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusNudgePage;
