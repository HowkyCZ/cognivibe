import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSearch } from "@tanstack/react-router";

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
          // Auto-start break when countdown reaches 0
          emit("break-warning-action", { action: "start" });
          getCurrentWindow().close();
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
    await emit("break-warning-action", { action: "start" });
    getCurrentWindow().close();
  };

  const handleAddTime = () => {
    setSecondsLeft((prev) => prev + 60);
  };

  const handleSkip = async () => {
    await emit("break-warning-action", { action: "skip" });
    getCurrentWindow().close();
  };

  const subtitle =
    reason === "high_cognitive_load"
      ? "Your cognitive load has been elevated"
      : `You've been working for ${minutes} minutes`;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black/0">
      <div
        className="w-full h-full flex flex-col items-start justify-center px-5 py-4 rounded-2xl border border-white/10 relative overflow-hidden"
        style={{
          background: "rgba(25, 20, 28, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Subtle gradient accent along top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, #a07cef 0%, #ff709b 100%)",
          }}
        />

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
            className="text-primary-600 border-primary/30 text-xs"
            onPress={handleAddTime}
          >
            + 1 min
          </Button>
          <Button
            size="sm"
            variant="bordered"
            className="text-primary-600 border-primary/30 text-xs"
            onPress={handleSkip}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BreakWarningPage;
