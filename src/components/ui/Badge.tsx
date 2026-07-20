import { createElement, ReactNode } from "react";
import {
  CheckCircle2,
  CalendarClock,
  Circle,
  Clock3,
  PauseCircle,
  MinusCircle,
  XCircle,
  Archive,
  AlertTriangle,
  CalendarX2,
  CalendarOff,
  AlertCircle,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";
import { ICON_STROKE_WIDTH } from "@/shared/constants/icons";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/8 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/12 text-warning-foreground",
        danger: "bg-danger/10 text-danger",
        info: "bg-info/10 text-info",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string | undefined;
}

export function Badge({ children, variant, size, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}

// Domain-status -> Badge variant preset, so every status label across the
// app (client/employee/assignment/visit/care-plan states) renders with a
// consistent color instead of each page picking its own. Not a separate
// component - "StatusChip" is just Badge with this mapping applied.
const STATUS_VARIANT_MAP: Record<string, NonNullable<BadgeProps["variant"]>> = {
  active: "success",
  completed: "success",
  scheduled: "primary",
  draft: "default",
  pending: "warning",
  medium: "warning",
  on_hold: "warning",
  inactive: "default",
  on_leave: "warning",
  cancelled: "default",
  archived: "default",
  low: "default",
  critical: "danger",
  high: "danger",
  expired: "danger",
  urgent: "danger",
  overdue: "danger",
  invited: "warning",
  accepted: "success",
  verified: "success",
  rejected: "danger",
  paid: "success",
  sent: "info",
  partially_paid: "warning",
};

export function statusVariant(status: string): NonNullable<BadgeProps["variant"]> {
  return STATUS_VARIANT_MAP[status?.toLowerCase()] ?? "default";
}

// Every status gets its own icon in addition to its color - a status is
// legible from shape alone, not just a color dot (important for
// colorblind users and for scanning a table quickly).
const STATUS_ICON_MAP: Record<string, LucideIcon> = {
  active: CheckCircle2,
  completed: CheckCircle2,
  scheduled: CalendarClock,
  draft: Circle,
  pending: Clock3,
  medium: Clock3,
  on_hold: PauseCircle,
  inactive: MinusCircle,
  on_leave: CalendarOff,
  cancelled: XCircle,
  archived: Archive,
  low: Circle,
  critical: AlertTriangle,
  high: AlertTriangle,
  expired: CalendarX2,
  urgent: AlertCircle,
  overdue: AlertTriangle,
  invited: Mail,
  accepted: CheckCircle2,
  verified: CheckCircle2,
  rejected: XCircle,
  paid: CheckCircle2,
  sent: Mail,
  partially_paid: Clock3,
};

function statusIcon(status: string): LucideIcon {
  return STATUS_ICON_MAP[status?.toLowerCase()] ?? Circle;
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: BadgeProps["size"];
  className?: string | undefined;
}

/**
 * Badge preset that colors and icons itself from a domain status string -
 * the unified status language used everywhere (active, pending, completed,
 * cancelled, critical, archived, draft, ...). Icon + color together so
 * status is legible at a glance without relying on color alone.
 */
export function StatusBadge({ status, label, size, className }: StatusBadgeProps) {
  const variant = statusVariant(status);
  return (
    <Badge variant={variant} size={size} className={className}>
      {createElement(statusIcon(status), {
        className: "h-3 w-3 shrink-0",
        strokeWidth: ICON_STROKE_WIDTH,
        "aria-hidden": true,
      })}
      {label ?? status ?? "Unknown"}
    </Badge>
  );
}
