import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
  Divider,
} from "@heroui/react";
import {
  IconSettingsFilled,
  IconHelpCircleFilled,
  IconLogout,
  IconBrain,
} from "@tabler/icons-react";
import { useAuth, useUserData } from "../../hooks";

interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSettingsOpen: () => void;
  onHelpOpen: () => void;
  onLogoutOpen: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onOpenChange,
  onSettingsOpen,
  onHelpOpen,
  onLogoutOpen,
}) => {
  const { session } = useAuth();
  const { userData, loading: userLoading } = useUserData(session?.user?.id);

  const displayName = userData?.nickname;
  const organizationName = userData?.organization?.brand_name || null;
  const displayEmail = session?.user?.email;
  const avatarSrc = userData?.avatar_url || undefined;

  const formattedDisplayName =
    displayName && organizationName
      ? `${displayName} | ${organizationName}`
      : displayName;

  const handleMenuAction = (action: () => void) => {
    action();
    onOpenChange(false); // Close the modal after action
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
      size="md"

    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-1">
              {/* Empty header for consistent spacing */}
            </ModalHeader>
            <ModalBody className="gap-4">
              {/* Profile Section */}
              <div className="flex gap-3 items-center">
                <Avatar
                  size="md"
                  src={avatarSrc}
                  name={displayName}
                  color="primary"
                  className="select-none"
                />
                <div className="flex flex-col">
                  <p className="text-base font-medium">
                    {userLoading ? "Loading..." : formattedDisplayName}
                  </p>
                  <p className="text-small opacity-70">{displayEmail}</p>
                </div>
              </div>

              <Divider />

              {/* Menu Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="flat"
                  startContent={<IconSettingsFilled className="h-5 w-5" />}
                  className="justify-start h-12"
                  onPress={() => handleMenuAction(onSettingsOpen)}
                >
                  My settings
                </Button>

                <Button
                  variant="flat"
                  startContent={<IconHelpCircleFilled className="h-5 w-5" />}
                  className="justify-start h-12"
                  onPress={() => handleMenuAction(onHelpOpen)}
                >
                  Help & support
                </Button>

                <Button
                  variant="flat"
                  startContent={<IconBrain className="h-5 w-5" />}
                  className="justify-start h-12"
                  onPress={() => {
                    window.open("https://cognivibe.com/research", "_blank");
                    onClose();
                  }}
                >
                  How it works & Research
                </Button>
              </div>

              <Divider />

              {/* Logout Button */}
              <Button
                color="danger"
                variant="flat"
                startContent={<IconLogout className="h-5 w-5" />}
                className="justify-start h-12"
                onPress={() => handleMenuAction(onLogoutOpen)}
              >
                Log out
              </Button>
            </ModalBody>
            <ModalFooter className="pt-0">
              {/* Empty footer for proper bottom spacing */}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default UserProfileModal;
