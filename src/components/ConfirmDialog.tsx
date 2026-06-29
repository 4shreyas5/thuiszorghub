"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const buttonVariant =
    variant === "danger" ? "destructive" : variant === "warning" ? "secondary" : "primary";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      closeOnEscape={!isLoading}
      closeOnBackdropClick={!isLoading}
    >
      <p className="text-gray-700 dark:text-gray-300">{message}</p>

      <div className="flex gap-3 justify-end mt-6">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={buttonVariant} onClick={onConfirm} loading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
