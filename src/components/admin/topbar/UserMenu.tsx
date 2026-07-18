"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { performCompleteLogout } from "@/core/auth/logout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InitialsAvatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

export function UserMenu() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await performCompleteLogout();
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/auth/login");
    } finally {
      setIsLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-full px-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <InitialsAvatar name={displayName} size="sm" />
            <span className="hidden max-w-32 truncate text-sm font-medium text-foreground md:block">
              {displayName || "User"}
            </span>
            <ChevronDown
              className={cn(ICON_SIZE.sm, "hidden text-muted-foreground md:block")}
              strokeWidth={ICON_STROKE_WIDTH}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-sm font-medium text-foreground">
              {displayName || "Account"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/admin/settings")}>
            <Settings className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
            <LogOut className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Log out"
        message="You'll need to sign in again to access the admin panel."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isLoggingOut}
      />
    </>
  );
}
