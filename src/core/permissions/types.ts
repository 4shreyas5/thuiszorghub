export type Resource =
  | "organizations"
  | "branches"
  | "users"
  | "employees"
  | "clients"
  | "visits"
  | "schedules"
  | "documents"
  | "notifications"
  | "reports"
  | "settings"
  | "audit-logs"
  | "billing";

export type Action = "create" | "read" | "update" | "delete" | "manage";

export type Permission = `${Resource}:${Action}`;

export interface PermissionContext {
  userId: string;
  organizationId: string;
  branchId?: string;
  roles: string[];
  permissions: Permission[];
}

export interface PermissionCheck {
  resource: Resource;
  action: Action;
  resourceId?: string;
}
