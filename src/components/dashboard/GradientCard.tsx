"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody, Button, useDisclosure } from "@heroui/react";
import { invoke } from "@tauri-apps/api/core";
import { QuestionnaireModal, QuestionnaireScores } from "../modals";
import { endSessionWithSurvey } from "../../utils/sessionsApi";
import SessionStatsCard from "./SessionStatsCard";

const SESSION_ACTIVE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const WIDTH_BREAKPOINT = 350; // Content width breakpoint (card has ~460px max content width)

// Session info returned from Tauri backend
interface SessionInfo {
  elapsed_ms: number;
  session_id: string;
}

// Clipboard icon component (default size)
const ClipboardIcon = ({ size = 32, padding = "p-3" }: { size?: number; padding?: string }) => (
  <div className={`bg-white/20 rounded-lg ${padding} shrink-0`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="text-white"
    >
      <path
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

interface ActiveViewProps {
  onStartClick: () => void;
}

// Narrow Active View
const NarrowActiveView = ({ onStartClick }: ActiveViewProps) => (
  <div className="flex flex-col items-center justify-center gap-4 w-full">
    <ClipboardIcon />
    <h2 className="text-lg font-semibold text-white text-center">
      Complete
      <br />
      Assessment
    </h2>
    <Button
      className="w-full bg-white text-[#a07cef] font-semibold text-md"
      size="lg"
      onPress={onStartClick}
    >
      START
    </Button>
  </div>
);

// Narrow Inactive View
const NarrowInactiveView = () => (
  <div className="flex flex-col items-center justify-center gap-3 w-full">
    <ClipboardIcon />
    <h2 className="text-lg font-semibold text-white text-center">
      No
      <br />
      Assessment
      <br />
      Available Now
    </h2>
  </div>
);

// Wide Active View
const WideActiveView = ({ onStartClick }: ActiveViewProps) => (
  <div className="flex flex-col items-start gap-4 w-full h-full">
    <div className="flex flex-row items-center gap-3">
      <ClipboardIcon />
      <h2 className="text-2xl font-semibold text-white">
        Complete
        <br />
        Assessment
      </h2>
    </div>
    <p className="text-sm text-white/90">
      Take <span className="font-bold">10 seconds</span> to asses your mental
      performance and{" "}
      <span className="italic">help us make our measurements more accurate.</span>
    </p>
    <Button
      className="self-end mt-auto bg-white text-[#a07cef] font-semibold text-lg"
      size="lg"
      onPress={onStartClick}
    >
      START
    </Button>
  </div>
);

// Wide Inactive View
const WideInactiveView = () => (
  <div className="flex flex-col gap-4 w-full">
    <div className="flex flex-row items-center gap-4">
      <ClipboardIcon size={40} padding="p-4" />
      <h2 className="text-3xl font-semibold text-white">
        Complete
        <br />
        Assessment
      </h2>
    </div>
    <p className="text-sm text-white/80">
      Filling out assessments helps us make our measurements more accurate.
      There is no assessment available. Check back in in a few minutes.
    </p>
  </div>
);

const GradientCard = () => {
  const [cardWidth, setCardWidth] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [devToggleActive, setDevToggleActive] = useState<boolean | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Modal state
  const {
    isOpen: isQuestionnaireOpen,
    onOpen: onQuestionnaireOpen,
    onOpenChange: onQuestionnaireOpenChange,
  } = useDisclosure();

  const isWide = cardWidth >= WIDTH_BREAKPOINT;
  
  // Debug: log the card width
  console.log("GradientCard width:", cardWidth, "isWide:", isWide);
  
  // Use dev toggle if set, otherwise use actual session state
  const displayIsSessionActive = devToggleActive !== null ? devToggleActive : isSessionActive;

  // Calculate session minutes from elapsed time
  const sessionMinutes = sessionInfo
    ? Math.floor(sessionInfo.elapsed_ms / (1000 * 60))
    : 0;

  // Width detection using ResizeObserver
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setCardWidth(entries[0].contentRect.width);
      }
    });

    resizeObserver.observe(contentRef.current);

    // Check initial width immediately
    if (contentRef.current) {
      setCardWidth(contentRef.current.getBoundingClientRect().width);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Session duration detection
  useEffect(() => {
    const checkSessionDuration = async () => {
      try {
        console.log("[GRADIENT_CARD] Checking session duration...");
        const info = await invoke<SessionInfo | null>("get_session_info");
        if (info !== null) {
          console.log("[GRADIENT_CARD] Session info retrieved:", {
            session_id: info.session_id,
            elapsed_ms: info.elapsed_ms,
            elapsed_minutes: Math.floor(info.elapsed_ms / (1000 * 60)),
            threshold_ms: SESSION_ACTIVE_THRESHOLD_MS,
            threshold_minutes: SESSION_ACTIVE_THRESHOLD_MS / (1000 * 60),
          });
          setSessionInfo(info);
          const wasActive = isSessionActive;
          const nowActive = info.elapsed_ms >= SESSION_ACTIVE_THRESHOLD_MS;
          setIsSessionActive(nowActive);
          
          if (wasActive !== nowActive) {
            console.log("[GRADIENT_CARD] Session active state changed:", {
              wasActive,
              nowActive,
              elapsed_ms: info.elapsed_ms,
            });
          }
        } else {
          console.log("[GRADIENT_CARD] No active session found");
          setSessionInfo(null);
          setIsSessionActive(false);
        }
      } catch (error) {
        console.error("[GRADIENT_CARD] ❌ Failed to get session info:", error);
        if (error instanceof Error) {
          console.error("[GRADIENT_CARD] Error details:", {
            message: error.message,
            stack: error.stack,
          });
        }
        setSessionInfo(null);
        setIsSessionActive(false);
      }
    };

    checkSessionDuration();
    // Check every minute to update when threshold is crossed
    const interval = setInterval(checkSessionDuration, 60000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic opacity based on session state
  const opacity = displayIsSessionActive ? 0.75 : 0.3;

  // Click handler to toggle active/inactive state (for local development)
  const handleCardClick = () => {
    setDevToggleActive((prev) => (prev === null ? !isSessionActive : !prev));
  };

  // Handle START button click - open questionnaire modal
  const handleStartClick = () => {
    console.log("[GRADIENT_CARD] START button clicked, refreshing session info...");
    // Refresh session info before opening modal
    invoke<SessionInfo | null>("get_session_info")
      .then((info) => {
        if (info) {
          console.log("[GRADIENT_CARD] ✅ Session info refreshed:", {
            session_id: info.session_id,
            elapsed_ms: info.elapsed_ms,
            session_minutes: Math.floor(info.elapsed_ms / (1000 * 60)),
          });
          setSessionInfo(info);
        } else {
          console.warn("[GRADIENT_CARD] ⚠️ No session info returned, using existing state");
        }
        console.log("[GRADIENT_CARD] Opening questionnaire modal");
        onQuestionnaireOpen();
      })
      .catch((error) => {
        console.error("[GRADIENT_CARD] ❌ Failed to get session info:", error);
        if (error instanceof Error) {
          console.error("[GRADIENT_CARD] Error details:", {
            message: error.message,
            stack: error.stack,
          });
        }
        // Still open modal with existing info
        console.log("[GRADIENT_CARD] Opening questionnaire modal with existing session info");
        onQuestionnaireOpen();
      });
  };

  // Handle questionnaire submission
  const handleQuestionnaireSubmit = async (scores: QuestionnaireScores) => {
    console.log("[GRADIENT_CARD] Questionnaire submission started:", {
      session_id: sessionInfo?.session_id,
      scores,
      scoreCount: Object.keys(scores).length,
    });

    if (!sessionInfo?.session_id) {
      console.error("[GRADIENT_CARD] ❌ No active session - cannot submit questionnaire");
      throw new Error("No active session");
    }

    try {
      console.log("[GRADIENT_CARD] Calling endSessionWithSurvey...");
      await endSessionWithSurvey(sessionInfo.session_id, scores);
      console.log("[GRADIENT_CARD] ✅ Questionnaire submitted successfully");
      
      // Reset session state after successful submission
      console.log("[GRADIENT_CARD] Resetting session state");
      setSessionInfo(null);
      setIsSessionActive(false);
      setDevToggleActive(null);
    } catch (error) {
      console.error("[GRADIENT_CARD] ❌ Failed to submit questionnaire:", error);
      if (error instanceof Error) {
        console.error("[GRADIENT_CARD] Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  };

  // Render the appropriate view based on width and session state
  const renderContent = () => {
    if (isWide && displayIsSessionActive) {
      return <WideActiveView onStartClick={handleStartClick} />;
    } else if (isWide && !displayIsSessionActive) {
      return <WideInactiveView />;
    } else if (!isWide && displayIsSessionActive) {
      return <NarrowActiveView onStartClick={handleStartClick} />;
    } else {
      return <NarrowInactiveView />;
    }
  };

  return (
    <>
      {/* Column layout wrapper - maintains original total height with adjusted ratio */}
      <div className="flex flex-col gap-4 w-full h-full">
        {/* Session Stats Card - reduced height (~24%) */}
        <div className="h-[24%] shrink-0">
          <SessionStatsCard
            sessionId={sessionInfo?.session_id ?? null}
            elapsedMs={sessionInfo?.elapsed_ms ?? 0}
          />
        </div>

        {/* Gradient Card - increased height (~76%, flex-1 takes remaining space) */}
        <Card 
          className="w-full flex-1 bg-content1 border border-white/10 hover:border-white/15 transition-colors relative overflow-hidden cursor-pointer"
          isPressable
          onPress={handleCardClick}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 bg-cv-accent-gradient transition-opacity duration-500"
            style={{ opacity }}
          />

          {/* Content */}
          <CardBody
            className={`relative z-10 flex items-center h-full p-6 w-full ${
              isWide ? "justify-start" : "justify-center"
            }`}
          >
            <div ref={contentRef} className="w-full h-full flex items-center">
              {renderContent()}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Questionnaire Modal */}
      <QuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onOpenChange={onQuestionnaireOpenChange}
        sessionMinutes={sessionMinutes}
        sessionId={sessionInfo?.session_id ?? null}
        onSubmit={handleQuestionnaireSubmit}
      />
    </>
  );
};

export default GradientCard;
