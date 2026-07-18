import Link from "next/link";
import {
  UserPlus,
  UserRound,
  HeartHandshake,
  CalendarPlus,
  ClipboardPlus,
  Mail,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface Action {
  label: string;
  href: string;
  icon: LucideIcon;
  tint: string;
}

const ACTIONS: Action[] = [
  {
    label: "Create Employee",
    href: "/admin/employees/new",
    icon: UserPlus,
    tint: "bg-info/10 text-info",
  },
  {
    label: "Create Client",
    href: "/admin/clients/new",
    icon: UserRound,
    tint: "bg-primary/10 text-primary",
  },
  {
    label: "Create Assignment",
    href: "/admin/assignments/new",
    icon: HeartHandshake,
    tint: "bg-success/10 text-success",
  },
  {
    label: "Schedule Visit",
    href: "/admin/visits/new",
    icon: CalendarPlus,
    tint: "bg-primary/10 text-primary",
  },
  {
    label: "Create Care Plan",
    href: "/admin/care-plans/new",
    icon: ClipboardPlus,
    tint: "bg-warning/15 text-warning-foreground",
  },
  { label: "Invite User", href: "/admin/users", icon: Mail, tint: "bg-info/10 text-info" },
];

/** A clean, menu-like list rather than a grid of boxed tiles. */
export function QuickActionsGrid() {
  return (
    <Card bordered padding="md" className="h-full">
      <CardHeader>
        <CardTitle size="sm">Quick Actions</CardTitle>
      </CardHeader>
      <ul className="divide-y divide-border">
        {ACTIONS.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="group flex items-center gap-3 rounded-md px-1 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${action.tint}`}
              >
                <action.icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              </span>
              <span className="flex-1 truncate">{action.label}</span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                strokeWidth={ICON_STROKE_WIDTH}
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
