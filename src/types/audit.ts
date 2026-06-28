import { Timestamp } from "./common";

export interface AuditLog extends Timestamp {
  id: string;
  organizationId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  errorMessage?: string;
}

export interface AuditLogEvent {
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  status: "success" | "failure";
  errorMessage?: string;
}

export interface AuditLogQuery {
  organizationId: string;
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}
