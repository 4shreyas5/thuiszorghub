"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useRef, useState } from "react";
import {
  Activity,
  Settings,
  ShieldCheck,
  LogOut,
  CalendarClock,
  UsersRound,
  Stethoscope,
  DollarSign,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { performCompleteLogout } from "@/core/auth/logout";
import { useOrganization } from "@/hooks/useOrganization";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface NavLink {
  label: string;
  href: string;
}

interface NavSection {
  key: string;
  label: string;
  icon: typeof ShieldCheck;
  links: NavLink[];
}

export const SECTIONS: NavSection[] = [
  {
    key: "administration",
    label: "Administration",
    icon: ShieldCheck,
    links: [
      { label: "Organization", href: "/admin/organization" },
      { label: "Branches", href: "/admin/branches" },
      { label: "Users", href: "/admin/users" },
      { label: "Roles", href: "/admin/roles" },
      { label: "Permissions", href: "/admin/permissions" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    icon: UsersRound,
    links: [
      { label: "Employees", href: "/admin/employees" },
      { label: "Clients", href: "/admin/clients" },
      { label: "Assignments", href: "/admin/assignments" },
    ],
  },
  {
    key: "clinical",
    label: "Clinical",
    icon: Stethoscope,
    links: [{ label: "Care Plans", href: "/admin/care-plans" }],
  },
  {
    key: "scheduling",
    label: "Scheduling",
    icon: CalendarClock,
    links: [{ label: "Visits", href: "/admin/scheduling" }],
  },
  {
    key: "billing",
    label: "Billing",
    icon: DollarSign,
    links: [
      { label: "Dashboard", href: "/admin/billing" },
      { label: "Invoices", href: "/admin/billing/invoices" },
      { label: "Payments", href: "/admin/billing/payments" },
      { label: "Timesheets", href: "/admin/billing/timesheets" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    links: [{ label: "Analytics", href: "/admin/reports" }],
  },
  {
    key: "system",
    label: "System",
    icon: Settings,
    links: [
      { label: "Audit Logs", href: "/admin/audit-logs" },
      { label: "Notifications", href: "/admin/notifications" },
      { label: "Documents", href: "/admin/documents" },
      { label: "Email Templates", href: "/admin/email-templates" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function activeSectionKey(pathname: string): string | undefined {
  return SECTIONS.find((section) => section.links.some((link) => isActive(pathname, link.href)))
    ?.key;
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

/**
 * Full-label nav tree - the primary desktop experience (inside
 * ExpandedSidebar) and also what the mobile Drawer overlay uses.
 */
export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await performCompleteLogout();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/auth/login");
    } finally {
      setIsLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-1.5 text-sm transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      isActive(pathname, href)
        ? "border-l-primary bg-accent font-medium text-foreground"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    );

  const ariaCurrent = (href: string) => (isActive(pathname, href) ? ("page" as const) : undefined);

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
        <Link
          href="/admin"
          onClick={() => onNavigate?.()}
          className={linkClass("/admin")}
          aria-current={ariaCurrent("/admin")}
        >
          <Activity className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
          <span>Dashboard</span>
        </Link>

        <Accordion
          type="single"
          collapsible
          defaultValue={activeSectionKey(pathname) ?? ""}
          className="space-y-1"
        >
          {SECTIONS.map((section) => {
            const sectionIsActive = section.links.some((link) => isActive(pathname, link.href));
            return (
              <AccordionItem key={section.key} value={section.key}>
                <AccordionTrigger
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-accent/60 hover:text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180",
                    sectionIsActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <section.icon
                      className={cn(ICON_SIZE.sm, "shrink-0")}
                      strokeWidth={ICON_STROKE_WIDTH}
                    />
                    {section.label}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pl-6 pt-0.5">
                  <div className="space-y-0.5">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => onNavigate?.()}
                        className={linkClass(link.href)}
                        aria-current={ariaCurrent(link.href)}
                      >
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-danger transition-colors duration-150 hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
          <span>Logout</span>
        </button>
      </div>

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
    </div>
  );
}

interface OrgIdentityProps {
  /** Trailing slot, e.g. the desktop collapse toggle. Unused by the mobile Drawer. */
  action?: ReactNode;
}

export function OrgIdentity({ action }: OrgIdentityProps) {
  const { organizationName, logoUrl, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-4">
        <Skeleton variant="circular" className="h-9 w-9" />
        <Skeleton variant="text" className="w-24" />
      </div>
    );
  }

  const name = organizationName ?? "ThuisZorgHub";

  return (
    <div className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-9 w-9 shrink-0 rounded-md object-cover" />
      ) : (
        <InitialsAvatar name={name} size="md" />
      )}
      <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
        {name}
      </span>
      {action}
    </div>
  );
}

/** Icon-only identity mark for the collapsed rail; full name on hover. */
function RailOrgIdentity() {
  const { organizationName, logoUrl, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex h-15 shrink-0 items-center justify-center border-b border-border">
        <Skeleton variant="circular" className="h-9 w-9" />
      </div>
    );
  }

  const name = organizationName ?? "ThuisZorgHub";

  return (
    <div className="flex h-15 shrink-0 items-center justify-center border-b border-border">
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Link
            href="/admin"
            aria-label={name}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="h-9 w-9 shrink-0 rounded-md object-cover" />
            ) : (
              <InitialsAvatar name={name} size="md" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{name}</TooltipContent>
      </Tooltip>
    </div>
  );
}

const CLOSE_DELAY_MS = 150;

const railIconButtonClass = (active: boolean) =>
  cn(
    "flex h-10 w-10 items-center justify-center rounded-md border-l-2 transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-l-primary bg-accent text-foreground"
      : "border-l-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
  );

const railFlyoutLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-accent font-medium text-foreground"
      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
  );

/** A section's rail icon; opens a flyout of its links on hover/focus. */
function RailSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionIsActive = section.links.some((link) => isActive(pathname, link.href));

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={railIconButtonClass(sectionIsActive)}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          onFocus={openNow}
          onBlur={closeSoon}
          aria-label={section.label}
          aria-current={sectionIsActive ? "page" : undefined}
        >
          <section.icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onFocus={openNow}
        onBlur={closeSoon}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-52 p-1.5"
      >
        <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {section.label}
        </p>
        <div className="space-y-0.5">
          {section.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={railFlyoutLinkClass(isActive(pathname, link.href))}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Labeled nav tree - the default desktop shell. Enterprise healthcare
 * office staff live in this panel all day; labels stay visible so nothing
 * depends on hover/memory to navigate.
 */
function ExpandedSidebar({ onCollapse }: { onCollapse: () => void }) {
  return (
    <aside className="m-4 hidden w-60 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-lg backdrop-blur-md lg:flex">
      <OrgIdentity
        action={
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onCollapse}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        }
      />
      <div className="flex-1 overflow-hidden">
        <SidebarContent />
      </div>
    </aside>
  );
}

/** Icon-only rail - opt-in, for users who collapse the sidebar themselves. */
function CollapsedRail({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await performCompleteLogout();
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
    <aside className="m-4 hidden w-16 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-lg backdrop-blur-md lg:flex">
      <RailOrgIdentity />

      <nav
        className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3"
        aria-label="Main navigation"
      >
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onExpand}
              className={cn(railIconButtonClass(false))}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>

        <div className="my-1 h-px w-8 bg-border" aria-hidden="true" />

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Link
              href="/admin"
              className={railIconButtonClass(isActive(pathname, "/admin"))}
              aria-current={isActive(pathname, "/admin") ? "page" : undefined}
            >
              <Activity className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Dashboard</TooltipContent>
        </Tooltip>

        <div className="my-2 h-px w-8 bg-border" aria-hidden="true" />

        {SECTIONS.map((section) => (
          <RailSection key={section.key} section={section} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t border-border py-3">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-danger transition-colors duration-150 hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Log out"
            >
              <LogOut className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      </div>

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
    </aside>
  );
}

const SIDEBAR_COLLAPSE_KEY = "admin-sidebar-collapsed";

/**
 * Desktop shell nav. Labeled tree by default - office staff use this all
 * day, so navigation shouldn't depend on hover/memory. Collapsing to an
 * icon rail is an opt-in the user chooses and this browser remembers, not
 * the default experience.
 */
export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true";
  });

  const setCollapsedPersisted = (next: boolean) => {
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
  };

  if (collapsed) {
    return <CollapsedRail onExpand={() => setCollapsedPersisted(false)} />;
  }
  return <ExpandedSidebar onCollapse={() => setCollapsedPersisted(true)} />;
}
