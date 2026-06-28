import { Timestamp, Locale } from "./common";

export interface Employee extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  employmentType: "full-time" | "part-time" | "contract" | "casual";
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  userId?: string;
  qualifications?: string[];
  languages?: Locale[];
  profileImageUrl?: string;
}

export interface EmployeeSchedule extends Timestamp {
  id: string;
  employeeId: string;
  organizationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface EmployeeAvailability extends Timestamp {
  id: string;
  employeeId: string;
  organizationId: string;
  dateFrom: Date;
  dateTo: Date;
  type: "available" | "unavailable" | "on-leave";
  reason?: string;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  employmentType: "full-time" | "part-time" | "contract" | "casual";
  startDate: Date;
  endDate?: Date;
  branchId?: string;
  qualifications?: string[];
  languages?: Locale[];
}
