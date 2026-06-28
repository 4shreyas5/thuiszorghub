import { Timestamp } from "./common";

export interface Schedule extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  type: "recurring" | "weekly" | "monthly" | "custom";
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface ScheduleTemplate extends Timestamp {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ScheduleEntry extends Timestamp {
  id: string;
  scheduleId: string;
  organizationId: string;
  employeeId?: string;
  clientId?: string;
  startTime: Date;
  endTime: Date;
  type: string;
  notes?: string;
}
