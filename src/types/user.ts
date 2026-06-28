import { Timestamp, Locale } from "./common";

export interface User extends Timestamp {
  id: string;
  authUserId: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: Locale;
  isActive: boolean;
  lastLoginAt?: Date;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface UserRole extends Timestamp {
  id: string;
  userId: string;
  organizationId: string;
  roleId: string;
  branchId?: string;
}

export interface Role extends Timestamp {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface Permission extends Timestamp {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  isSystem: boolean;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface InvitationToken extends Timestamp {
  id: string;
  organizationId: string;
  email: string;
  token: string;
  roleId: string;
  branchId?: string;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedByUserId?: string;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: Locale;
  roleId: string;
  branchId?: string;
}

export interface InviteUserPayload {
  email: string;
  roleId: string;
  branchId?: string;
  sendEmail?: boolean;
}
