"use client";

import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

const drawerContentVariants = cva(
  "fixed z-(--z-modal) flex flex-col bg-card text-card-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out duration-300",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-full max-w-md border-l border-border data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        left: "inset-y-0 left-0 h-full w-full max-w-md border-r border-border data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        top: "inset-x-0 top-0 max-h-[80vh] w-full border-b border-border data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        bottom:
          "inset-x-0 bottom-0 max-h-[80vh] w-full border-t border-border data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface DrawerProps extends VariantProps<typeof drawerContentVariants> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Drawer({ isOpen, onClose, title, children, actions, side }: DrawerProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--z-modal) bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className={cn(drawerContentVariants({ side }))}>
          <div className="flex items-center justify-between border-b border-border p-6">
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close panel"
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
