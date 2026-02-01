import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { IconLockOpen } from "@tabler/icons-react";

interface PermissionsWelcomeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const PermissionsWelcomeModal = ({
  isOpen,
  onOpenChange,
}: PermissionsWelcomeModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      isDismissable
    >
      <ModalContent>
        {() => (
          <>
            <ModalBody className="flex flex-col items-center gap-4 pt-8 pb-2 text-center">
              <IconLockOpen
                className="h-14 w-14 shrink-0 text-foreground"
                stroke={1.5}
              />
              <h2 className="text-xl font-semibold">
                Welcome! Before we start...
              </h2>
              <p className="text-small text-foreground/80 max-w-md">
                We need these permissions to measure your activity. Please click
                &quot;Continue&quot; and confirm them. The app may need to be
                restarted. Your privacy is important to us and no sensitive data
                ever leaves your computer.
              </p>
            </ModalBody>
            <ModalFooter className="justify-center pb-8">
              <Button color="primary" onPress={() => onOpenChange(false)}>
                Continue
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default PermissionsWelcomeModal;
