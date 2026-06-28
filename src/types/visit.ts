import { Timestamp } from "./common";

export interface Visit extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  clientId: string;
  employeeId: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show";
  visitType: string;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
}

export interface VisitTask extends Timestamp {
  id: string;
  visitId: string;
  organizationId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: Date;
  order: number;
}

export interface VisitNote extends Timestamp {
  id: string;
  visitId: string;
  organizationId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
}

export interface VisitSignature extends Timestamp {
  id: string;
  visitId: string;
  organizationId: string;
  signedByType: "client" | "employee";
  signedByName: string;
  signatureDataUrl: string;
}

export interface CreateVisitPayload {
  clientId: string;
  employeeId: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  visitType: string;
  branchId?: string;
  notes?: string;
}

export interface UpdateVisitPayload {
  status?: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show";
  actualStartTime?: Date;
  actualEndTime?: Date;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
}
