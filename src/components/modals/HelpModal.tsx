import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  addToast,
  Form,
} from "@heroui/react";
import { useState } from "react";
import { IconHelpCircleFilled, IconMailFilled } from "@tabler/icons-react";

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

const HelpModal = ({ isOpen, onOpenChange }: HelpModalProps) => {
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy async function to simulate sending feedback
  const submitFeedback = async (message: string) => {
    console.log("Submitting feedback:", message);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Feedback submitted successfully!");
    return { success: true };
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackMessage.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await submitFeedback(feedbackMessage);
        // Show success toast
        addToast({
          title: "Feedback sent successfully!",
          description:
            "Thank you for contacting the CogniVibe team. We'll review your message and get back to you soon.",
          color: "success",
          timeout: 10000, // 10 seconds
          variant: "flat",
        });
        setFeedbackMessage(""); // Reset form
        // Close modal by setting isOpen to false
        handleModalClose(false);
      } catch (error) {
        console.error("Error submitting feedback:", error);
        addToast({
          title: "Error sending feedback",
          description: "Please try again later.",
          color: "danger",
          timeout: 5000,
          variant: "flat",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!isSubmitting) {
      if (!open) {
        setFeedbackMessage(""); // Reset form when modal closes
        setIsSubmitting(false); // Reset submitting state
      }
      onOpenChange();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      onOpenChange={handleModalClose}
    >
      <ModalContent>
        <Form onSubmit={handleFormSubmit}>
          <ModalHeader className="flex items-center">
            <IconHelpCircleFilled className="h-6 w-6 mr-2" />
            Contact the CogniVibe team
          </ModalHeader>
          <ModalBody>
            <p>
              We are here to help you! If you have any questions or need
              assistance, please feel free to reach out.
            </p>
            <Textarea
              name="feedback"
              placeholder="Type your feedback or message here..."
              className="w-full"
              value={feedbackMessage}
              onValueChange={setFeedbackMessage}
              isRequired
              isDisabled={isSubmitting}
              minLength={10}
              maxLength={1000}
              rows={4}
              autoFocus
              errorMessage={(value) => {
                if (value.validationDetails.valueMissing) {
                  return "Please enter your feedback message";
                }
                if (value.validationDetails.tooShort) {
                  return "Message must be at least 10 characters long";
                }
                if (value.validationDetails.tooLong) {
                  return "Message must be less than 1000 characters";
                }
              }}
            />
          </ModalBody>
          <ModalFooter className="w-full">
            <Button
              color="primary"
              type="submit"
              isDisabled={!feedbackMessage.trim() || isSubmitting}
              isLoading={isSubmitting}
              startContent={
                !isSubmitting ? (
                  <IconMailFilled className="h-5 w-5" />
                ) : undefined
              }
              fullWidth
            >
              {isSubmitting ? "Sending..." : "Send feedback or message"}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default HelpModal;
