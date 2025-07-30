import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Input,
  addToast,
  Form,
  Code,
  Alert,
} from "@heroui/react";
import { useState, useEffect } from "react";
import {
  IconSettingsFilled,
  IconTrash,
  IconAlertTriangle,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useAppSettings, AppSettings, useAuth } from "../../hooks";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

const SettingsModal = ({ isOpen, onOpenChange }: SettingsModalProps) => {
  const {
    settings: appSettings,
    updateSettings,
    loading: settingsLoading,
  } = useAppSettings();
  const { deleteUser, signOut } = useAuth();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  // Load settings when modal opens
  useEffect(() => {
    if (isOpen && appSettings) {
      setLocalSettings(appSettings);
      setOriginalSettings(appSettings);
    }
  }, [isOpen, appSettings]);

  // Check if there are unsaved changes
  const hasChanges =
    localSettings && originalSettings
      ? JSON.stringify(localSettings) !== JSON.stringify(originalSettings)
      : false; // Handle saving settings
  const handleSave = async (closeAfterSave = false) => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setOriginalSettings({ ...localSettings });

      addToast({
        title: "Settings saved successfully",
        description: "Your preferences have been updated.",
        color: "success",
        timeout: 5000,
        variant: "flat",
      });

      if (closeAfterSave) {
        onOpenChange();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      addToast({
        title: "Error saving settings",
        description: "Please try again later.",
        color: "danger",
        timeout: 5000,
        variant: "flat",
      });
    } finally {
      setIsSaving(false);
      setShowUnsavedChangesModal(false);
    }
  };

  // Handle account deletion - show confirmation modal first
  const handleDeleteAccount = () => {
    setShowDeleteConfirmModal(true);
  };

  // Handle actual account deletion after confirmation
  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUser();

      addToast({
        title: "Account deleted successfully",
        description: "Your account and all data have been permanently removed.",
        color: "success",
        timeout: 10000,
        variant: "flat",
      });

      // Close modals
      setShowDeleteConfirmModal(false);
      setDeleteConfirmText("");
      onOpenChange();

      await signOut();
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Please try again later or contact support.";

      addToast({
        title: "Error deleting account",
        description: errorMessage,
        color: "danger",
        timeout: 10000,
        variant: "flat",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle closing delete confirmation modal
  const handleCloseDeleteConfirm = () => {
    if (!isDeleting) {
      setShowDeleteConfirmModal(false);
      setDeleteConfirmText("");
    }
  };

  // Check if delete confirmation text is correct
  const isDeleteConfirmValid = deleteConfirmText === "DELETE MY ACCOUNT";
  // Handle modal close
  const handleModalClose = () => {
    if (!isSaving && !isDeleting) {
      if (hasChanges) {
        // Show confirmation modal if there are unsaved changes
        setShowUnsavedChangesModal(true);
      } else {
        // Close normally if no changes
        onOpenChange();
      }
    }
  };
  // Handle leaving without saving
  const handleLeaveWithoutSaving = () => {
    if (originalSettings) {
      setLocalSettings({ ...originalSettings }); // Reset to original settings
    }
    setShowUnsavedChangesModal(false);
    onOpenChange();
  };

  // Handle save and leave
  const handleSaveAndLeave = async () => {
    await handleSave(true);
  };
  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={handleModalClose}
        placement="center"
        isDismissable={!isSaving && !isDeleting}
        isKeyboardDismissDisabled={isSaving || isDeleting}
        size="md"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex items-center">
                <IconSettingsFilled className="h-6 w-6 mr-2" />
                Settings
              </ModalHeader>
              <ModalBody>
                <Form className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">
                      Application Settings
                    </h4>
                    <Checkbox
                      isSelected={localSettings?.start_on_boot ?? false}
                      onValueChange={(value) =>
                        setLocalSettings((prev) =>
                          prev ? { ...prev, start_on_boot: value } : null
                        )
                      }
                      isDisabled={isSaving || isDeleting || settingsLoading}
                    >
                      Start CogniVibe on computer boot
                    </Checkbox>
                    <Checkbox
                      isSelected={localSettings?.auto_start_measuring ?? false}
                      onValueChange={(value) =>
                        setLocalSettings((prev) =>
                          prev ? { ...prev, auto_start_measuring: value } : null
                        )
                      }
                      isDisabled={isSaving || isDeleting || settingsLoading}
                    >
                      Auto start monitoring when app opens
                    </Checkbox>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-danger">
                      Danger Zone
                    </h4>
                    <div className="p-4 border border-danger-200 rounded-lg bg-danger-50">
                      <p className="text-sm  mb-3">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <Button
                        color="danger"
                        variant="bordered"
                        startContent={
                          !isDeleting ? (
                            <IconTrash className="h-4 w-4" />
                          ) : undefined
                        }
                        onPress={handleDeleteAccount}
                        isDisabled={isSaving || isDeleting}
                        isLoading={isDeleting}
                        size="sm"
                      >
                        {isDeleting ? "Deleting Account..." : "Delete Account"}
                      </Button>
                    </div>
                  </div>
                </Form>
              </ModalBody>
              <ModalFooter className="justify-between">
                <Button
                  color="default"
                  variant="light"
                  onPress={handleModalClose}
                  isDisabled={isSaving || isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleSave(true)}
                  isDisabled={!hasChanges || isSaving || isDeleting}
                  isLoading={isSaving}
                  startContent={
                    !isSaving ? (
                      <IconDeviceFloppy className="h-4 w-4" />
                    ) : undefined
                  }
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Unsaved Changes Confirmation Modal */}
      <Modal
        isOpen={showUnsavedChangesModal}
        onOpenChange={() => setShowUnsavedChangesModal(false)}
        placement="center"
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center">
                <IconAlertTriangle className="h-6 w-6 mr-2 text-warning" />
                Unsaved Changes
              </ModalHeader>
              <ModalBody>
                <p>You have unsaved changes. What would you like to do?</p>
              </ModalBody>
              <ModalFooter className="justify-between">
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleLeaveWithoutSaving}
                >
                  Leave Without Saving
                </Button>
                <Button
                  color="primary"
                  onPress={handleSaveAndLeave}
                  isLoading={isSaving}
                  isDisabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save & Leave"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onOpenChange={handleCloseDeleteConfirm}
        placement="center"
        size="md"
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center">
                <IconTrash className="h-6 w-6 mr-2 text-danger" />
                Confirm Account Deletion
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Alert
                    color="danger"
                    variant="flat"
                    className="mb-4"
                    hideIcon
                  >
                    Are you sure you want to delete your account? This action is
                    irreversible and will permanently remove all your data.
                  </Alert>

                  <div>
                    <span className="flex items-center mb-2 gap-1">
                      <p className="text-sm font-medium">
                        To confirm deletion, please type
                      </p>
                      <Code color="danger" size="sm">
                        DELETE MY ACCOUNT
                      </Code>
                    </span>
                    <Input
                      value={deleteConfirmText}
                      onValueChange={setDeleteConfirmText}
                      placeholder="DELETE MY ACCOUNT"
                      isDisabled={isDeleting}
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmDeleteAccount}
                  isDisabled={!isDeleteConfirmValid || isDeleting}
                  isLoading={isDeleting}
                  startContent={
                    !isDeleting ? <IconTrash className="h-4 w-4" /> : undefined
                  }
                >
                  {isDeleting ? "Deleting Account..." : "Delete Account"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default SettingsModal;
