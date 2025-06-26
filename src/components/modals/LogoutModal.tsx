import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";

interface LogoutModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

const LogoutModal = ({ isOpen, onOpenChange }: LogoutModalProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      addToast({
        title: "Logged out successfully",
        description: "You have been logged out of CogniVibe.",
        color: "success",
        timeout: 5000,
        variant: "flat",
      });
      // The auth state change will be handled by the useAuth hook
      // and will automatically redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
      addToast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        color: "danger",
        timeout: 5000,
        variant: "flat",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleModalClose = () => {
    if (!isLoggingOut) {
      onOpenChange();
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleModalClose}
      placement="center"
      isDismissable={!isLoggingOut}
      isKeyboardDismissDisabled={isLoggingOut}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isLoggingOut) {
          e.preventDefault();
          handleLogout().then(() => onOpenChange());
        }
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center">
                <IconLogout className="h-6 w-6 mr-2 text-danger" />
                Confirm Logout
              </div>
            </ModalHeader>
            <ModalBody>
              <p>
                Are you sure you want to log out of CogniVibe? You will need to
                sign in again to access your dashboard.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={() => {
                  if (!isLoggingOut) {
                    onOpenChange();
                  }
                }}
                isDisabled={isLoggingOut}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={async () => {
                  await handleLogout();
                  onOpenChange();
                }}
                startContent={
                  !isLoggingOut ? <IconLogout className="h-4 w-4" /> : undefined
                }
                isDisabled={isLoggingOut}
                isLoading={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LogoutModal;
