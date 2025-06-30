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
import { useAuth } from "../../hooks";
import { fetch } from "@tauri-apps/plugin-http";
import { API_CONFIG } from "../../utils/apiConfig";

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

const HelpModal = ({ isOpen, onOpenChange }: HelpModalProps) => {
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  // API function to send feedback
  const submitFeedback = async (message: string) => {
    try {
      // Check if user is authenticated
      if (!session) {
        throw new Error("Authentication required. Please log in again.");
      }

      if (!session.user?.id) {
        throw new Error("User ID not found in session.");
      }

      console.log("Submitting feedback:", {
        message,
        userId: session.user.id,
        jwt: session.access_token,
      });

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_FEEDBACK}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            jwt: session.access_token,
            userId: session.user.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to send feedback");
      }

      return result;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
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
        const errorMessage =
          error instanceof Error ? error.message : "Please try again later.";
        addToast({
          title: "Error sending feedback",
          description: errorMessage,
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
              maxLength={5000}
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
