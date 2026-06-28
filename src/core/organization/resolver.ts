import type { PermissionContext, Permission } from "@/core/permissions/types";
import type { UserProfile } from "@/types/auth";

export interface OrganizationInfo {
  organizationId: string;
  organizationName: string;
  role: string;
  roles: string[];
  permissions: Permission[];
}

export class OrganizationResolver {
  static createContext(
    user: UserProfile | null,
    organizationInfo: OrganizationInfo | null
  ): PermissionContext | null {
    if (!user || !organizationInfo) {
      return null;
    }

    const context: PermissionContext = {
      userId: user.id,
      organizationId: organizationInfo.organizationId,
      roles: organizationInfo.roles || [organizationInfo.role],
      permissions: organizationInfo.permissions || [],
    };

    return context;
  }

  static getDefaultRole(roles: string[]): string {
    const roleHierarchy = [
      "super_admin",
      "organization_owner",
      "branch_manager",
      "scheduler",
      "administrator",
      "caregiver",
      "finance",
      "auditor",
    ];

    for (const role of roleHierarchy) {
      if (roles.includes(role)) {
        return role;
      }
    }

    return roles[0] || "guest";
  }

  static async resolveFromUser(user: UserProfile): Promise<OrganizationInfo | null> {
    return {
      organizationId: user.organizationId,
      organizationName: "",
      role: "",
      roles: [],
      permissions: [],
    };
  }

  static isMultiTenant(organizations: string[]): boolean {
    return organizations.length > 1;
  }

  static canSwitchOrganization(currentRole: string, organizations: string[]): boolean {
    const switchableRoles = ["super_admin"];
    return switchableRoles.includes(currentRole) || this.isMultiTenant(organizations);
  }
}
