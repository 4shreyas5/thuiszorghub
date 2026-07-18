"use client";

import { useRouter } from "next/navigation";
import { UserPlus, UserRound, Link2, CalendarPlus, Mail, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

export interface QuickAction {
  label: string;
  href: string;
  icon: typeof UserPlus;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Create Employee", href: "/admin/employees/new", icon: UserPlus },
  { label: "Create Client", href: "/admin/clients/new", icon: UserRound },
  { label: "New Assignment", href: "/admin/assignments/new", icon: Link2 },
  { label: "Schedule Visit", href: "/admin/visits/new", icon: CalendarPlus },
  { label: "Invite User", href: "/admin/users", icon: Mail },
  { label: "View Reports", href: "/admin/reports", icon: BarChart3 },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
        >
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {QUICK_ACTIONS.map((action) => (
          <DropdownMenuItem key={action.href} onSelect={() => router.push(action.href)}>
            <action.icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
