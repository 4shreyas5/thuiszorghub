import { NextRequest } from "next/server";

export interface TenantContext {
  organizationId: string;
  branchId?: string;
  userId?: string;
}

export class TenantResolver {
  static extractFromRequest(request: NextRequest): TenantContext | null {
    const pathParts = request.nextUrl.pathname.split("/").filter(Boolean);

    const headerOrgId = request.headers.get("x-organization-id");
    const headerBranchId = request.headers.get("x-branch-id");
    const headerUserId = request.headers.get("x-user-id");

    if (!headerOrgId && pathParts.length < 1) {
      return null;
    }

    const organizationId = headerOrgId || pathParts[0];

    const context: TenantContext = {
      organizationId,
    };

    if (headerBranchId) {
      context.branchId = headerBranchId;
    } else if (pathParts.length > 1) {
      context.branchId = pathParts[1];
    }

    if (headerUserId) {
      context.userId = headerUserId;
    }

    return context;
  }

  static validateTenant(tenant: TenantContext | null): boolean {
    if (!tenant || !tenant.organizationId) {
      return false;
    }

    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return guidRegex.test(tenant.organizationId);
  }
}
