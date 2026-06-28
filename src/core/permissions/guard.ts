import { PermissionContext, PermissionCheck } from "./types";

export class PermissionGuard {
  static canAccess(context: PermissionContext, check: PermissionCheck): boolean {
    const permissionString: `${typeof check.resource}:${typeof check.action}` = `${check.resource}:${check.action}`;

    return context.permissions.includes(permissionString as never);
  }

  static requirePermission(context: PermissionContext, check: PermissionCheck): void {
    if (!this.canAccess(context, check)) {
      throw new Error(`Permission denied: ${check.resource}:${check.action}`);
    }
  }

  static hasRole(context: PermissionContext, role: string): boolean {
    return context.roles.includes(role);
  }

  static isOwner(context: PermissionContext, ownerId: string): boolean {
    return context.userId === ownerId;
  }

  static belongsToOrganization(context: PermissionContext, organizationId: string): boolean {
    return context.organizationId === organizationId;
  }

  static belongsToBranch(context: PermissionContext, branchId: string): boolean {
    return context.branchId === branchId;
  }
}
