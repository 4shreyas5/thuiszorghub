import { Timestamp } from "./common";

export interface Employee extends Timestamp {
  id: string;
  organization_id: string;
  branch_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_type: "full-time" | "part-time" | "contract" | "casual";
  hourly_rate?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  bio?: string;
  avatar_url?: string;
  is_deleted: boolean;
  deleted_at?: string;
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
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {
  is_active?: boolean;
}
