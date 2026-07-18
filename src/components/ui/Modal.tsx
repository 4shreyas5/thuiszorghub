"use client";

import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = "md",
  closeOnEscape = true,
  closeOnBackdropClick = true,
}: ModalProps) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-(--z-modal) bg-black/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          )}
        />
        <Dialog.Content
          onEscapeKeyDown={(e) => {
            if (!closeOnEscape) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (!closeOnBackdropClick) e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-(--z-modal) flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-card text-card-foreground shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "duration-200",
            sizeClasses[size]
          )}
        >
          <div className="flex items-center justify-between border-b border-border p-6">
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close modal"
              >
                <X className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {actions && (
            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              {actions}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
