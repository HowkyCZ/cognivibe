"use client";

import { Card, CardBody, Button, useDisclosure } from "@heroui/react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useAuth, useUserData, useExtremeZScoreAlert } from "../../hooks";
import { ZScoreSurveyModal } from "../modals";

interface WelcomeTourCardProps {
  onStartClick?: () => void;
}

const WelcomeTourCard = ({ onStartClick }: WelcomeTourCardProps) => {
  const { session } = useAuth();
  const { userData, loading, refetch } = useUserData(session?.user?.id);
  const { alert: extremeZScoreAlert, clearAlert } = useExtremeZScoreAlert();
  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onOpenChange: onSurveyOpenChange,
  } = useDisclosure();

  const handleTourStartClick = async () => {
    if (onStartClick) {
      onStartClick();
    }
    console.log("[WELCOME_TOUR] START button clicked, opening tour window");

    // Open tour in a new Tauri window
    const tourWindow = new WebviewWindow("tour", {
      url: "/tour",
      title: "Welcome to Cognivibe",
      width: 900,
      height: 700,
      center: true,
      resizable: false,
      decorations: true,
      transparent: false,
      focus: true,
    });

    // Handle window creation errors
    tourWindow.once("tauri://error", (e) => {
      console.error("[WELCOME_TOUR] Failed to create tour window:", e);
    });

    // When tour window closes, refetch user data to check if tutorial was completed
    tourWindow.once("tauri://destroyed", () => {
      console.log("[WELCOME_TOUR] Tour window closed, refetching user data");
      refetch();
    });
  };

  const handleSurveyStartClick = () => {
    console.log("[ZSCORE_CARD] START button clicked, opening survey modal");
    onSurveyOpen();
  };

  const handleSurveySuccess = async () => {
    console.log("[ZSCORE_CARD] Survey submitted successfully, clearing alert");
    await clearAlert();
  };

  // Determine card mode
  const showTourCard = !loading && userData && !userData.opened_tutorial;
  const showZScoreCard = !showTourCard && extremeZScoreAlert !== null;

  // Don't render if neither condition is met
  if (!showTourCard && !showZScoreCard) {
    return null;
  }

  // Tour card variant
  if (showTourCard) {
    return (
      <Card
        className="w-full mb-4 relative overflow-hidden border border-white/10"
        style={{
          // Subtle gradient glow effect (tighter, softer)
          boxShadow: `
            0 0 12px rgba(160, 124, 239, 0.2),
            0 0 20px rgba(160, 124, 239, 0.08),
            0 4px 12px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Gradient background - fully opaque */}
        <div className="absolute inset-0 bg-cv-accent-gradient opacity-100" />

        {/* Content */}
        <CardBody className="relative z-10 flex flex-row items-center justify-between py-4 px-6">
          {/* Left side - Text */}
          <div className="flex flex-col gap-0 leading-tight">
            <span className="text-lg font-bold text-white">
              Welcome to Cognivibe!
            </span>
            <span className="text-sm text-white/90">
              Let's get started with a short tour.
            </span>
          </div>

          {/* Right side - Button */}
          <Button
            className="bg-white text-[#ff709b] font-semibold text-lg shrink-0 ml-4"
            size="lg"
            onPress={handleTourStartClick}
          >
            START
          </Button>
        </CardBody>
      </Card>
    );
  }

  // Extreme Z-score card variant
  if (showZScoreCard && extremeZScoreAlert) {
    return (
      <>
        <Card
          className="w-full mb-4 relative overflow-hidden border border-white/10"
          style={{
            // Subtle gradient glow effect (tighter, softer)
            boxShadow: `
              0 0 12px rgba(160, 124, 239, 0.2),
              0 0 20px rgba(160, 124, 239, 0.08),
              0 4px 12px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Gradient background - fully opaque */}
          <div className="absolute inset-0 bg-cv-accent-gradient opacity-100" />

          {/* Content */}
          <CardBody className="relative z-10 flex flex-row items-center justify-between py-4 px-6">
            {/* Left side - Dynamic Text */}
            <div className="flex flex-col gap-0 leading-tight">
              <span className="text-lg font-bold text-white">
                Your {extremeZScoreAlert.metric_name} is {extremeZScoreAlert.direction}.
              </span>
              <span className="text-sm text-white/90">
                What happened? Help us improve the accuracy of Cognivibe.
              </span>
            </div>

            {/* Right side - Button */}
            <Button
              className="bg-white text-[#ff709b] font-semibold text-lg shrink-0 ml-4"
              size="lg"
              onPress={handleSurveyStartClick}
            >
              START
            </Button>
          </CardBody>
        </Card>

        {/* Z-Score Survey Modal */}
        <ZScoreSurveyModal
          isOpen={isSurveyOpen}
          onOpenChange={onSurveyOpenChange}
          cognitiveScoreId={extremeZScoreAlert.cognitive_score_id}
          onSubmitSuccess={handleSurveySuccess}
        />
      </>
    );
  }

  return null;
};

export default WelcomeTourCard;
