import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  Card,
  CardBody,
} from "@heroui/react";
import {
  IconDownload,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { relaunch } from "@tauri-apps/plugin-process";
import { DownloadEvent } from "@tauri-apps/plugin-updater";

interface UpdateModalProps {
  isOpen: boolean;
  update: {
    version: string;
    date: string;
    body: string;
  };
  onDownloadAndInstall: (
    onProgress: (event: DownloadEvent) => void
  ) => Promise<void>;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  update,
  onDownloadAndInstall,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string>("");
  const [contentLength, setContentLength] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadAndInstall = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      let downloaded = 0;

      await onDownloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setContentLength(event.data?.contentLength || 0);
            setDownloadStatus("Starting download...");
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            const progress =
              contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setDownloadProgress(progress);
            setDownloadStatus(
              `Downloaded ${formatBytes(downloaded)} of ${formatBytes(contentLength)}`
            );
            break;
          case "Finished":
            setDownloadProgress(100);
            setDownloadStatus("Download complete");
            setIsDownloading(false);
            setIsInstalling(true);
            break;
        }
      });

      // Update installed successfully
      setIsInstalling(false);
      setDownloadStatus(
        "Update installed successfully. Restarting application..."
      );

      // Restart the application
      setTimeout(async () => {
        await relaunch();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to download and install update"
      );
      setIsDownloading(false);
      setIsInstalling(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      hideCloseButton
      isDismissable={false}
      size="2xl"
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconRefresh className="h-5 w-5 text-primary" />
            <span>Update Available</span>
          </div>
          <p className="text-sm text-foreground/60">
            Version {update.version} • {formatDate(update.date)}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Release Notes */}
            <Card>
              <CardBody>
                <h4 className="font-semibold mb-2">What's New</h4>
                <div className="text-sm text-foreground/60 whitespace-pre-wrap">
                  {update.body || "No release notes available."}
                </div>
              </CardBody>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-danger">
                <CardBody>
                  <div className="flex items-center gap-2 text-danger">
                    <IconAlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Error</span>
                  </div>
                  <p className="text-sm text-danger-600 mt-1">{error}</p>
                </CardBody>
              </Card>
            )}

            {(isDownloading || isInstalling || downloadProgress > 0) && (
              <Card>
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {isInstalling ? "Installing..." : "Downloading..."}
                    </span>
                    <span className="text-sm text-foreground/60">
                      {Math.round(downloadProgress)}%
                    </span>
                  </div>
                  <Progress
                    value={downloadProgress}
                    className="w-full"
                    color={isInstalling ? "secondary" : "primary"}
                  />
                  <p className="text-xs text-foreground/60">{downloadStatus}</p>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={handleDownloadAndInstall}
            isLoading={isDownloading || isInstalling}
            isDisabled={isDownloading || isInstalling}
            startContent={
              !isDownloading && !isInstalling ? (
                <IconDownload className="h-4 w-4" />
              ) : undefined
            }
            fullWidth
          >
            {isInstalling
              ? "Installing Update..."
              : isDownloading
                ? "Downloading..."
                : "Download and Install"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
