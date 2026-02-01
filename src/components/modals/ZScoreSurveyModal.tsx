import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Slider,
  addToast,
} from "@heroui/react";
import { useState } from "react";
import { IconClipboardCheck, IconSend } from "@tabler/icons-react";
import { submitZScoreSurvey } from "../../utils/zscoreSurveyApi";
import { useAuth } from "../../hooks/useAuth";

// Z-Score survey question definitions
interface ZScoreQuestion {
  id: "focused" | "stressed" | "productive";
  text: string;
  leftLabel: string;
  rightLabel: string;
}

const ZSCORE_QUESTIONS: ZScoreQuestion[] = [
  {
    id: "focused",
    text: "How focused do you feel right now?",
    leftLabel: "Not at all",
    rightLabel: "Extremely",
  },
  {
    id: "stressed",
    text: "How stressed do you feel right now?",
    leftLabel: "Not at all",
    rightLabel: "Extremely",
  },
  {
    id: "productive",
    text: "How productive do you feel right now?",
    leftLabel: "Not at all",
    rightLabel: "Extremely",
  },
];

interface ZScoreSliderProps {
  question: ZScoreQuestion;
  value: number;
  hasBeenTouched: boolean;
  onChange: (value: number) => void;
  onTouch: () => void;
}

const ZScoreSlider = ({
  question,
  value,
  hasBeenTouched,
  onChange,
  onTouch,
}: ZScoreSliderProps) => {
  const handleChange = (val: number | number[]) => {
    const newValue = Array.isArray(val) ? val[0] : val;
    onChange(newValue);
    onTouch();
  };

  return (
    <div className="w-full space-y-3">
      <p className="text-base font-medium text-foreground">{question.text}</p>
      <div className="px-2">
        <Slider
          aria-label={question.text}
          color="primary"
          defaultValue={50}
          maxValue={100}
          minValue={0}
          showOutline={true}
          size="sm"
          step={1}
          value={value}
          onChange={handleChange}
          classNames={{
            track: hasBeenTouched
              ? "border-s-primary-500 bg-default-300/50"
              : "border-s-default-400 bg-default-300/50",
            filler: hasBeenTouched
              ? "bg-gradient-to-r from-primary-500 to-secondary-400"
              : "bg-default-400",
          }}
        />
        <div className="flex justify-between text-xs text-default-500 mt-1.5">
          <span>{question.leftLabel}</span>
          <span className="text-default-400">{hasBeenTouched ? value : "—"}</span>
          <span>{question.rightLabel}</span>
        </div>
      </div>
    </div>
  );
};

interface ZScoreSurveyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cognitiveScoreId: number;
  onSubmitSuccess?: () => void;
}

export default function ZScoreSurveyModal({
  isOpen,
  onOpenChange,
  cognitiveScoreId,
  onSubmitSuccess,
}: ZScoreSurveyModalProps) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({
    focused: 50,
    stressed: 50,
    productive: 50,
  });
  const [touchedQuestions, setTouchedQuestions] = useState<Set<string>>(new Set());

  const allQuestionsTouched = ZSCORE_QUESTIONS.every((q) =>
    touchedQuestions.has(q.id)
  );

  const handleValueChange = (questionId: string, value: number) => {
    setValues((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleTouch = (questionId: string) => {
    setTouchedQuestions((prev) => new Set(prev).add(questionId));
  };

  const handleSubmit = async () => {
    if (!session?.access_token) {
      addToast({
        title: "Error",
        description: "You must be logged in to submit responses.",
        color: "danger",
      });
      return;
    }

    if (!allQuestionsTouched) {
      addToast({
        title: "Incomplete",
        description: "Please answer all questions before submitting.",
        color: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitZScoreSurvey(
        cognitiveScoreId,
        {
          focused: values.focused,
          stressed: values.stressed,
          productive: values.productive,
        },
        session.access_token
      );

      addToast({
        title: "Thank you!",
        description: "Your responses have been saved.",
        color: "success",
      });

      onOpenChange(false);
      onSubmitSuccess?.();

      // Reset state for next use
      setValues({ focused: 50, stressed: 50, productive: 50 });
      setTouchedQuestions(new Set());
    } catch (error) {
      console.error("[ZSCORE_SURVEY] Failed to submit:", error);
      addToast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="lg"
      backdrop="blur"
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <IconClipboardCheck size={20} className="text-primary" />
              <span>Quick Check-In</span>
            </ModalHeader>
            <ModalBody className="py-6 space-y-6">
              <p className="text-sm text-default-500">
                We noticed something unusual in your activity patterns. Help us
                improve accuracy by answering these quick questions.
              </p>
              {ZSCORE_QUESTIONS.map((question) => (
                <ZScoreSlider
                  key={question.id}
                  question={question}
                  value={values[question.id]}
                  hasBeenTouched={touchedQuestions.has(question.id)}
                  onChange={(val) => handleValueChange(question.id, val)}
                  onTouch={() => handleTouch(question.id)}
                />
              ))}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!allQuestionsTouched || isSubmitting}
                endContent={!isSubmitting && <IconSend size={16} />}
              >
                Submit
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
