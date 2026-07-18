"use client";

import { Menu } from "lucide-react";
import { Breadcrumbs } from "./topbar/Breadcrumbs";
import { GlobalSearch } from "./topbar/GlobalSearch";
import { QuickActions } from "./topbar/QuickActions";
import { NotificationsMenu } from "./topbar/NotificationsMenu";
import { UserMenu } from "./topbar/UserMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface AdminTopbarProps {
  onOpenMobileNav: () => void;
  /** True while the content area is scrolled - adds a separating shadow. */
  elevated?: boolean;
}

export function AdminTopbar({ onOpenMobileNav, elevated = false }: AdminTopbarProps) {
  return (
    <header
      className={cn(
        "flex h-15 shrink-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 shadow-md backdrop-blur-md transition-shadow duration-150 sm:px-6",
        elevated && "shadow-lg"
      )}
    >
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
      </button>

      <div className="hidden min-w-0 flex-1 overflow-hidden md:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <GlobalSearch />
        <div className="hidden md:block">
          <QuickActions />
        </div>
        <ThemeToggle className="rounded-full border-0 bg-transparent" />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
