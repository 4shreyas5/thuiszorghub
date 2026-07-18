import { Timestamp } from "./common";

export type EmployeeStatus = "active" | "inactive" | "on_leave" | "archived";

// Deliberately NOT `extends Timestamp` - that type declares camelCase
// createdAt/updatedAt as Date objects, but the employees API returns raw
// Supabase rows (snake_case string timestamps). Declaring the real shape
// here instead of the mismatched shared type.
export interface Employee {
  id: string;
  organization_id: string;
  branch_id: string;
  branch?: { id: string; name: string };
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_type: "full-time" | "part-time" | "contract" | "casual";
  hourly_rate?: number;
  start_date: string;
  end_date?: string;
  status: EmployeeStatus;
  is_active: boolean;
  bio?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  qualifications?: EmployeeQualification[];
  languages?: EmployeeLanguage[];
  availability?: EmployeeAvailability[];
  unavailability?: EmployeeUnavailability[];
}

export interface EmployeeQualification extends Timestamp {
  id: string;
  employee_id: string;
  qualification: string;
  certification_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface EmployeeLanguage extends Timestamp {
  id: string;
  employee_id: string;
  language: string;
  proficiency_level: "native" | "fluent" | "intermediate" | "beginner";
  is_deleted: boolean;
  deleted_at?: string;
}

export interface EmployeeAvailability extends Timestamp {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface EmployeeUnavailability extends Timestamp {
  id: string;
  employee_id: string;
  unavailability_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  branch_id: string;
  employment_type: "full-time" | "part-time" | "contract" | "casual";
  start_date: string;
  end_date?: string;
  hourly_rate?: number;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {
  status?: EmployeeStatus;
  is_active?: boolean;
}
