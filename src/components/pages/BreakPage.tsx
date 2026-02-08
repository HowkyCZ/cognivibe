import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSearch } from "@tanstack/react-router";
import { convertFileSrc } from "@tauri-apps/api/core";
import SessionSurvey, { QuestionnaireScores } from "../SessionSurvey";
import { endSessionWithSurvey } from "../../utils/sessionsApi";

const BreakPage = () => {
  const search = useSearch({ strict: false }) as {
    reason?: string;
    minutes?: string;
    sessionId?: string;
    duration?: string;
    screenshot?: string;
  };
  const reason = search.reason || "long_session";
  const minutes = parseInt(search.minutes || "90", 10);
  const sessionId = search.sessionId || null;
  const duration = parseInt(search.duration || "120", 10);
  const screenshotPath = search.screenshot || "";

  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [timerDone, setTimerDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Convert screenshot file path to asset URL
  useEffect(() => {
    if (screenshotPath) {
      try {
        const assetUrl = convertFileSrc(screenshotPath);
        setScreenshotUrl(assetUrl);
      } catch {
        setScreenshotUrl(null);
      }
    }
  }, [screenshotPath]);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Break countdown timer
  useEffect(() => {
    if (timerDone) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerDone]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAddTime = () => {
    if (timerDone) {
      setTimerDone(false);
    }
    setSecondsLeft((prev) => prev + 60);
  };

  const handleSurveySubmit = async (scores: QuestionnaireScores) => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      await endSessionWithSurvey(sessionId, scores);
      await emit("break-completed", {});
      getCurrentWindow().close();
    } catch (error) {
      console.error("[BREAK] Failed to end session with survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (sessionId) {
      try {
        await endSessionWithSurvey(sessionId);
      } catch (error) {
        console.error("[BREAK] Failed to end session on skip:", error);
      }
    }
    await emit("break-skipped", {});
    getCurrentWindow().close();
  };

  const heading =
    reason === "high_cognitive_load" ? "Give your mind a reset" : "Time to recharge";

  const subtitle = timerDone
    ? "Break complete — submit your assessment to continue"
    : "Step away from the screen for a moment";

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Layer 1: Screenshot background */}
      {screenshotUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${screenshotUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Layer 2: Blur overlay (glassmorphism) */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(16px) saturate(0.7) brightness(0.35)",
          WebkitBackdropFilter: "blur(16px) saturate(0.7) brightness(0.35)",
          backgroundColor: screenshotUrl
            ? "rgba(25, 20, 28, 0.45)"
            : "rgba(25, 20, 28, 1)",
        }}
      />

      {/* Layer 3: Purple (bottom-left) to pink (top-right) gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top right, rgba(160, 124, 239, 0.3) 0%, rgba(200, 118, 197, 0.15) 40%, rgba(255, 112, 155, 0.2) 100%)",
        }}
      />

      {/* Layer 4: Content */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center overflow-auto">
        {/* Current time */}
        <p className="text-white/50 text-sm mb-8">{currentTime}</p>

        {/* Heading */}
        <h1 className="text-white text-4xl font-bold mb-2">{heading}</h1>
        <p className="text-white/60 text-base mb-8">{subtitle}</p>

        {/* Timer */}
        <p
          className={`text-5xl font-light mb-8 ${
            timerDone ? "text-success" : "text-white"
          }`}
        >
          {formatTime(secondsLeft)}
        </p>

        {/* Timer controls */}
        <div className="flex items-center gap-3 mb-10">
          <Button
            size="sm"
            variant="bordered"
            className="text-white/70 border-white/20"
            onPress={handleAddTime}
          >
            + 1 min
          </Button>
          <Button
            size="sm"
            variant="bordered"
            className="text-white/70 border-white/20"
            onPress={handleSkip}
            isDisabled={isSubmitting}
          >
            Skip
          </Button>
        </div>

        {/* Survey section */}
        <div
          className="w-full max-w-md px-6 py-5 rounded-2xl border border-white/10"
          style={{
            background: "rgba(34, 29, 40, 0.7)",
            backdropFilter: "blur(16px)",
          }}
        >
          <SessionSurvey
            sessionMinutes={minutes}
            onSubmit={handleSurveySubmit}
            isSubmitting={isSubmitting}
            compact
          />
        </div>
      </div>
    </div>
  );
};

export default BreakPage;
