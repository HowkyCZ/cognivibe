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
  Slider,
  Select,
  SelectItem,
  Switch,
  Divider,
} from "@heroui/react";
import { useState, useEffect } from "react";
import {
  IconSettingsFilled,
  IconTrash,
  IconAlertTriangle,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useAppSettings, AppSettings, useAuth } from "../../hooks";

const APP_CATEGORIES = [
  "Communication",
  "Meetings",
  "Media and Entertainment",
  "Docs and Writing",
  "Productivity and Planning",
  "Browsing and Research",
  "Development",
  "Design and Creative",
  "Data and Analytics",
  "Other",
];

const FOCUS_SENSITIVITY_OPTIONS = [
  { value: "3.0", label: "Low (3x baseline)" },
  { value: "2.0", label: "Medium (2x baseline)" },
  { value: "1.5", label: "High (1.5x baseline)" },
];

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
                      isSelected={localSettings?.should_start_on_boot ?? false}
                      onValueChange={(value) =>
                        setLocalSettings((prev) =>
                          prev ? { ...prev, should_start_on_boot: value } : null
                        )
                      }
                      isDisabled={isSaving || isDeleting || settingsLoading}
                    >
                      Start CogniVibe on computer boot
                    </Checkbox>
                    <Checkbox
                      isSelected={
                        localSettings?.should_autostart_measuring ?? false
                      }
                      onValueChange={(value) =>
                        setLocalSettings((prev) =>
                          prev
                            ? { ...prev, should_autostart_measuring: value }
                            : null
                        )
                      }
                      isDisabled={isSaving || isDeleting || settingsLoading}
                    >
                      Auto start monitoring when app opens
                    </Checkbox>
                  </div>

                  <Divider />

                  {/* Breaks & Focus Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Breaks & Focus</h4>

                    <div className="space-y-3">
                      <Switch
                        isSelected={localSettings?.break_nudge_enabled ?? true}
                        onValueChange={(value) =>
                          setLocalSettings((prev) =>
                            prev ? { ...prev, break_nudge_enabled: value } : null
                          )
                        }
                        isDisabled={isSaving || isDeleting || settingsLoading}
                        size="sm"
                      >
                        Break nudges
                      </Switch>

                      {localSettings?.break_nudge_enabled && (
                        <div className="space-y-4 pl-2">
                          <Slider
                            label="Break after (minutes)"
                            step={10}
                            minValue={30}
                            maxValue={180}
                            value={localSettings?.break_interval_minutes ?? 90}
                            onChange={(value) =>
                              setLocalSettings((prev) =>
                                prev
                                  ? { ...prev, break_interval_minutes: value as number }
                                  : null
                              )
                            }
                            isDisabled={isSaving || isDeleting || settingsLoading}
                            size="sm"
                            className="max-w-full"
                          />
                          <Slider
                            label="Break duration (seconds)"
                            step={30}
                            minValue={30}
                            maxValue={300}
                            value={localSettings?.break_duration_seconds ?? 120}
                            onChange={(value) =>
                              setLocalSettings((prev) =>
                                prev
                                  ? { ...prev, break_duration_seconds: value as number }
                                  : null
                              )
                            }
                            isDisabled={isSaving || isDeleting || settingsLoading}
                            size="sm"
                            className="max-w-full"
                          />
                          <Slider
                            label="Score threshold"
                            step={5}
                            minValue={50}
                            maxValue={90}
                            value={localSettings?.break_score_threshold ?? 70}
                            onChange={(value) =>
                              setLocalSettings((prev) =>
                                prev
                                  ? { ...prev, break_score_threshold: value as number }
                                  : null
                              )
                            }
                            isDisabled={isSaving || isDeleting || settingsLoading}
                            size="sm"
                            className="max-w-full"
                          />
                          <div className="space-y-2">
                            <p className="text-sm text-default-500">
                              Auto-pause during
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {APP_CATEGORIES.map((cat) => (
                                <Checkbox
                                  key={cat}
                                  size="sm"
                                  isSelected={
                                    localSettings?.break_auto_pause_categories?.includes(cat) ?? false
                                  }
                                  onValueChange={(checked) =>
                                    setLocalSettings((prev) => {
                                      if (!prev) return null;
                                      const cats = prev.break_auto_pause_categories ?? [];
                                      return {
                                        ...prev,
                                        break_auto_pause_categories: checked
                                          ? [...cats, cat]
                                          : cats.filter((c) => c !== cat),
                                      };
                                    })
                                  }
                                  isDisabled={isSaving || isDeleting || settingsLoading}
                                >
                                  {cat}
                                </Checkbox>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Switch
                        isSelected={localSettings?.focus_nudge_enabled ?? true}
                        onValueChange={(value) =>
                          setLocalSettings((prev) =>
                            prev ? { ...prev, focus_nudge_enabled: value } : null
                          )
                        }
                        isDisabled={isSaving || isDeleting || settingsLoading}
                        size="sm"
                      >
                        Focus nudges
                      </Switch>

                      {localSettings?.focus_nudge_enabled && (
                        <div className="pl-2">
                          <Select
                            label="Focus sensitivity"
                            selectedKeys={[
                              String(localSettings?.focus_nudge_sensitivity ?? 2.0),
                            ]}
                            onSelectionChange={(keys) => {
                              const val = Array.from(keys)[0] as string;
                              setLocalSettings((prev) =>
                                prev
                                  ? { ...prev, focus_nudge_sensitivity: parseFloat(val) }
                                  : null
                              );
                            }}
                            isDisabled={isSaving || isDeleting || settingsLoading}
                            size="sm"
                            className="max-w-xs"
                          >
                            {FOCUS_SENSITIVITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  <Divider />

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Danger Zone</h4>
                    <Button
                      className="btn-plain"
                      color="danger"
                      variant="ghost"
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
                  <Alert color="danger" className="mb-4" hideIcon>
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
                  className="btn-plain"
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
