"use client";

import { useMemo } from "react";
import { useAuth } from "@/core/context/auth-context";
import { PermissionService } from "@/core/permissions/service";
import type { PermissionContext, Resource, Action } from "@/core/permissions/types";

export interface UsePermissionsReturn {
  context: PermissionContext | null;
  can: (resource: Resource, action: Action) => boolean;
  canThrow: (resource: Resource, action: Action) => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isOrganizationOwner: () => boolean;
  isBranchManager: () => boolean;
  isCaregiver: () => boolean;
  canViewReports: () => boolean;
  canExportReports: () => boolean;
  canManageUsers: () => boolean;
  canManageRoles: () => boolean;
  canViewBilling: () => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated } = useAuth();

  const context: PermissionContext | null = useMemo(() => {
    if (!isAuthenticated || !user) return null;

    return {
      userId: user.id,
      organizationId: user.organizationId,
      roles: [],
      permissions: [],
    } as PermissionContext;
  }, [isAuthenticated, user]);

  return {
    context,
    can: (resource: Resource, action: Action) => {
      if (!context) return false;
      return PermissionService.check(context, resource, action);
    },
    canThrow: (resource: Resource, action: Action) => {
      if (!context) return;
      PermissionService.checkOrThrow(context, resource, action);
    },
    hasRole: (role: string) => {
      if (!context) return false;
      return PermissionService.hasRole(context, role);
    },
    hasAnyRole: (roles: string[]) => {
      if (!context) return false;
      return PermissionService.hasAnyRole(context, roles);
    },
    hasAllRoles: (roles: string[]) => {
      if (!context) return false;
      return PermissionService.hasAllRoles(context, roles);
    },
    isSuperAdmin: () => {
      if (!context) return false;
      return PermissionService.isSuperAdmin(context);
    },
    isOrganizationOwner: () => {
      if (!context) return false;
      return PermissionService.isOrganizationOwner(context);
    },
    isBranchManager: () => {
      if (!context) return false;
      return PermissionService.isBranchManager(context);
    },
    isCaregiver: () => {
      if (!context) return false;
      return PermissionService.isCaregiver(context);
    },
    canViewReports: () => {
      if (!context) return false;
      return PermissionService.canViewReports(context);
    },
    canExportReports: () => {
      if (!context) return false;
      return PermissionService.canExportReports(context);
    },
    canManageUsers: () => {
      if (!context) return false;
      return PermissionService.canManageUsers(context);
    },
    canManageRoles: () => {
      if (!context) return false;
      return PermissionService.canManageRoles(context);
    },
    canViewBilling: () => {
      if (!context) return false;
      return PermissionService.canViewBilling(context);
    },
  };
}
