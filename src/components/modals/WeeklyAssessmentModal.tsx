import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Slider,
  addToast,
} from "@heroui/react";
import { IconBrain, IconDeviceFloppy } from "@tabler/icons-react";

interface WeeklyAssessmentModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSubmit: (data: WeeklyAssessmentData) => void;
}

interface WeeklyAssessmentData {
  overallScore: number;
  notes: string;
}

const WeeklyAssessmentModal: React.FC<WeeklyAssessmentModalProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<WeeklyAssessmentData>({
    overallScore: 5,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!formData.overallScore) {
      addToast({
        title: "Incomplete Assessment",
        description: "Please select a score for your cognitive performance.",
        color: "warning",
        timeout: 3000,
        variant: "flat",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      onSubmit(formData);

      addToast({
        title: "Assessment Completed",
        description: "Your weekly assessment has been saved successfully.",
        color: "success",
        timeout: 5000,
        variant: "flat",
      }); // Reset form
      setFormData({
        overallScore: 5,
        notes: "",
      });

      onOpenChange();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        color: "danger",
        timeout: 5000,
        variant: "flat",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      onOpenChange();
    }
  };

  const getEmoji = (score: number) => {
    switch (score) {
      case 1:
        return "😴"; // Very tired/poor
      case 2:
        return "😞"; // Sad/struggling
      case 3:
        return "😕"; // Slightly frowning
      case 4:
        return "😐"; // Neutral/meh
      case 5:
        return "🙂"; // Slightly positive
      case 6:
        return "😊"; // Good mood
      case 7:
        return "😄"; // Happy/good
      case 8:
        return "🤩"; // Very good/excited
      case 9:
        return "🚀"; // Excellent/on fire
      case 10:
        return "🧠"; // Peak performance/brain power
      default:
        return "🙂";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleModalClose}
      placement="center"
      size="lg"
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center">
                <IconBrain className="h-6 w-6 mr-2 text-primary" />
                Weekly Cognitive Assessment
              </div>
            </ModalHeader>{" "}
            <ModalBody className="gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    How would you rate your overall cognitive performance this
                    week?
                  </h3>
                  <p className="text-sm text-default-500 mb-4">
                    Consider factors like focus, mental clarity, stress levels,
                    and productivity.
                  </p>
                </div>

                <Slider
                  label="Cognitive Performance Score"
                  step={1}
                  minValue={1}
                  maxValue={10}
                  value={formData.overallScore}
                  onChange={(value) =>
                    setFormData({ ...formData, overallScore: value as number })
                  }
                  className="w-full"
                  showSteps
                  renderValue={({ children, ...props }) => (
                    <output {...props}>
                      <div className="flex flex-col items-center">
                        {" "}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-3xl">
                            {getEmoji(formData.overallScore)}
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {children}
                          </span>
                        </div>
                        <span className="text-sm text-default-500">
                          {formData.overallScore <= 3 && "Poor Performance"}
                          {formData.overallScore > 3 &&
                            formData.overallScore <= 6 &&
                            "Average Performance"}
                          {formData.overallScore > 6 &&
                            formData.overallScore <= 8 &&
                            "Good Performance"}
                          {formData.overallScore > 8 && "Excellent Performance"}
                        </span>
                      </div>
                    </output>
                  )}
                />
              </div>

              <Textarea
                label="Additional Notes"
                placeholder="Any additional thoughts or observations about your cognitive performance this week? (Optional)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                variant="bordered"
                maxRows={4}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={handleModalClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>{" "}
              <Button
                color="primary"
                onPress={handleSubmit}
                startContent={
                  !isSubmitting ? (
                    <IconDeviceFloppy className="h-4 w-4" />
                  ) : undefined
                }
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Assessment"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default WeeklyAssessmentModal;
