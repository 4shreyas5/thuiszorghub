import { PermissionError } from "@/core/errors/types";
import type { Permission, Resource, Action, PermissionContext } from "@/core/permissions/types";

export class PermissionService {
  static check(context: PermissionContext, resource: Resource, action: Action): boolean {
    const permission: Permission = `${resource}:${action}`;
    return context.permissions.includes(permission);
  }

  static checkOrThrow(context: PermissionContext, resource: Resource, action: Action): void {
    if (!this.check(context, resource, action)) {
      throw new PermissionError(`Permission denied for ${resource}:${action}`, "PERMISSION_DENIED");
    }
  }

  static hasRole(context: PermissionContext, role: string): boolean {
    return context.roles.includes(role);
  }

  static hasAnyRole(context: PermissionContext, roles: string[]): boolean {
    return roles.some((role) => context.roles.includes(role));
  }

  static hasAllRoles(context: PermissionContext, roles: string[]): boolean {
    return roles.every((role) => context.roles.includes(role));
  }

  static canAccessOrganization(context: PermissionContext, organizationId: string): boolean {
    return context.organizationId === organizationId;
  }

  static canAccessBranch(context: PermissionContext, branchId: string): boolean {
    return context.branchId === branchId || !context.branchId;
  }

  static getFilteredPermissions(context: PermissionContext, resource: Resource): Action[] {
    const resourcePrefix = `${resource}:`;
    return context.permissions
      .filter((p) => p.startsWith(resourcePrefix))
      .map((p) => p.replace(resourcePrefix, "") as Action);
  }

  static canManageOrganization(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner"]);
  }

  static canManageBranch(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner", "branch_manager"]);
  }

  static canManageUsers(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner"]);
  }

  static canManageRoles(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner"]);
  }

  static canViewAuditLogs(context: PermissionContext): boolean {
    return this.hasAnyRole(context, [
      "super_admin",
      "organization_owner",
      "branch_manager",
      "auditor",
    ]);
  }

  static canExportReports(context: PermissionContext): boolean {
    return this.hasAnyRole(context, [
      "super_admin",
      "organization_owner",
      "branch_manager",
      "finance",
    ]);
  }

  static isSuperAdmin(context: PermissionContext): boolean {
    return this.hasRole(context, "super_admin");
  }

  static isOrganizationOwner(context: PermissionContext): boolean {
    return this.hasRole(context, "organization_owner");
  }

  static isBranchManager(context: PermissionContext): boolean {
    return this.hasRole(context, "branch_manager");
  }

  static isCaregiver(context: PermissionContext): boolean {
    return this.hasRole(context, "caregiver");
  }

  static isFinanceStaff(context: PermissionContext): boolean {
    return this.hasRole(context, "finance");
  }

  static canViewReports(context: PermissionContext): boolean {
    return this.check(context, "reports", "read");
  }

  static canCreateReports(context: PermissionContext): boolean {
    return this.check(context, "reports", "create");
  }

  static canViewBilling(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner", "finance"]);
  }

  static canManageBilling(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner"]);
  }

  static canViewSettings(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner", "branch_manager"]);
  }

  static canManageSettings(context: PermissionContext): boolean {
    return this.hasAnyRole(context, ["super_admin", "organization_owner"]);
  }

  static canDeleteData(context: PermissionContext, resource: Resource): boolean {
    return this.check(context, resource, "delete");
  }

  static canUpdateData(context: PermissionContext, resource: Resource): boolean {
    return this.check(context, resource, "update");
  }

  static canCreateData(context: PermissionContext, resource: Resource): boolean {
    return this.check(context, resource, "create");
  }

  static canReadData(context: PermissionContext, resource: Resource): boolean {
    return this.check(context, resource, "read");
  }
}
