import React, { useState } from "react";
import { useDisclosure } from "@heroui/react";
import ActionCard from "./ActionCard";
import WeeklyAssessmentModal from "../modals/WeeklyAssessmentModal";

interface WeeklyAssessmentData {
  overallScore: number;
  notes: string;
}

const WeeklyAssessmentCard: React.FC = () => {
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleAssessmentSubmit = (data: WeeklyAssessmentData) => {
    console.log("Assessment submitted:", data);
    setHasCompletedAssessment(true);
  };

  const handleCardPress = () => {
    if (!hasCompletedAssessment) {
      onOpen();
    }
  };

  return (
    <>
      <ActionCard
        title={
          hasCompletedAssessment
            ? "Weekly Assessment Complete"
            : "Complete Weekly Assessment"
        }
        description={
          hasCompletedAssessment
            ? "You've completed this week's cognitive assessment. Great job!"
            : "Take a few minutes to assess your cognitive performance this week."
        }
        icon={
          hasCompletedAssessment
            ? "solar:check-circle-bold"
            : "solar:clipboard-list-linear"
        }
        color={hasCompletedAssessment ? "success" : "primary"}
        onPress={handleCardPress}
      />
      <WeeklyAssessmentModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSubmit={handleAssessmentSubmit}
      />
    </>
  );
};

export default WeeklyAssessmentCard;
