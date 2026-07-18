import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center rounded-lg p-14 text-center",
  {
    variants: {
      tone: {
        neutral: "",
        error: "",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Also serves as the Error State primitive (tone="error") - same shape
 * (icon + title + description + action), just a different accent color,
 * so no separate ErrorState component is needed.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ tone }), className)}>
      {Icon && (
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
            tone === "error" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
