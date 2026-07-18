"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  organization: "Organization",
  branches: "Branches",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  settings: "Settings",
  employees: "Employees",
  clients: "Clients",
  assignments: "Assignments",
  "care-plans": "Care Plans",
  scheduling: "Scheduling",
  visits: "Visits",
  billing: "Billing",
  invoices: "Invoices",
  payments: "Payments",
  timesheets: "Timesheets",
  reports: "Reports",
  "audit-logs": "Audit Logs",
  notifications: "Notifications",
  documents: "Documents",
  "email-templates": "Email Templates",
  "design-system": "Design System",
  docs: "Handbook",
  new: "New",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function labelFor(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (UUID_RE.test(segment)) return "Details";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    return {
      label: labelFor(segment),
      ...(isLast ? {} : { href }),
    };
  });

  if (items.length <= 1) return null;

  return <Breadcrumb items={items} />;
}
