"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    // Lifecycle (auto-dismiss timer + exit animation) is owned by
    // ToastItem itself, so both the timeout path and the manual-close
    // path go through the same animate-out-then-remove sequence.
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const TOAST_ICON: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_ICON_CLASSES: Record<ToastType, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

const TOAST_BG_CLASSES: Record<ToastType, string> = {
  success: "bg-success/10 border-success/20",
  error: "bg-danger/10 border-danger/20",
  warning: "bg-warning/10 border-warning/20",
  info: "bg-info/10 border-info/20",
};

const EXIT_DURATION_MS = 200;

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = TOAST_ICON[toast.type];
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    if (toast.duration === Infinity) return;
    const timer = setTimeout(dismiss, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, dismiss]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => onRemove(toast.id), EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [leaving, onRemove, toast.id]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-sm",
        leaving
          ? "animate-out fade-out slide-out-to-right-4 duration-200"
          : "animate-in fade-in slide-in-from-top-4 duration-300",
        TOAST_BG_CLASSES[toast.type]
      )}
      role="alert"
    >
      <div className={cn("mt-0.5 shrink-0", TOAST_ICON_CLASSES[toast.type])}>
        <Icon className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{toast.message}</p>
        {toast.description && (
          <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Close notification"
      >
        <X className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-(--z-toast) max-w-sm space-y-3"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
