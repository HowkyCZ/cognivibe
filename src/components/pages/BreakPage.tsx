import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSearch } from "@tanstack/react-router";
import SessionSurvey, { QuestionnaireScores } from "../SessionSurvey";
import { endSessionWithSurvey } from "../../utils/sessionsApi";

const BreakPage = () => {
  const search = useSearch({ strict: false }) as {
    reason?: string;
    minutes?: string;
    sessionId?: string;
    duration?: string;
  };
  const reason = search.reason || "long_session";
  const minutes = parseInt(search.minutes || "90", 10);
  const sessionId = search.sessionId || null;
  const duration = parseInt(search.duration || "120", 10);

  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [timerDone, setTimerDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

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
    // Break always ends session (without survey)
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
    <div
      className="h-screen w-screen flex flex-col items-center justify-center overflow-auto"
      style={{
        background:
          "linear-gradient(135deg, rgba(160, 124, 239, 0.35) 0%, rgba(160, 124, 239, 0.2) 25%, rgba(25, 20, 28, 0.95) 55%, #19141c 100%)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}
    >
      {/* Current time */}
      <p className="text-white/50 text-sm mb-8">{currentTime}</p>

      {/* Heading */}
      <h1 className="text-white text-4xl font-bold mb-2">{heading}</h1>
      <p className="text-white/60 text-base mb-8">{subtitle}</p>

      {/* Divider */}
      <div
        className="w-16 h-px mb-8"
        style={{
          background: "linear-gradient(90deg, #a07cef 0%, #ff709b 100%)",
          opacity: 0.4,
        }}
      />

      {/* Timer */}
      <p
        className={`text-5xl font-light mb-8 ${
          timerDone ? "text-success" : "text-primary-700"
        }`}
      >
        {formatTime(secondsLeft)}
      </p>

      {/* Timer controls */}
      <div className="flex items-center gap-3 mb-10">
        <Button
          size="sm"
          variant="bordered"
          className="text-primary-600 border-primary/30"
          onPress={handleAddTime}
        >
          + 1 min
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="text-primary-600 border-primary/30"
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
          background: "rgba(34, 29, 40, 0.8)",
          backdropFilter: "blur(10px)",
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
  );
};

export default BreakPage;
