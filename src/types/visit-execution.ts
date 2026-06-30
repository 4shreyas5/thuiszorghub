export type MedicationStatus = "given" | "not_given" | "refused" | "unavailable" | "late";
export type VitalSign = "temperature" | "blood_pressure" | "heart_rate" | "respiratory_rate" | "oxygen_saturation";
export type VisitNoteCategory = "observation" | "incident" | "mood" | "pain" | "vitals" | "recommendation";

export interface VisitExecution {
  id: string;
  scheduled_visit_id: string;
  organization_id: string;
  started_at?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  actual_duration_minutes?: number;
  billable_duration_minutes?: number;
  status: "pending" | "started" | "in_progress" | "completed" | "cancelled";
  completed_at?: string;
  completed_by_id?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  visit_id: string;
  care_plan_task_id: string;
  completed_at: string;
  completed_by_id: string;
  status: "completed" | "skipped" | "partially_completed";
  notes?: string;
  skipped_reason?: string;
  created_at: string;
}

export interface MedicationRecord {
  id: string;
  visit_id: string;
  medication_name: string;
  prescribed_dosage?: string;
  administered_dosage?: string;
  status: MedicationStatus;
  administered_at?: string;
  administered_by_id?: string;
  not_given_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VisitNote {
  id: string;
  visit_id: string;
  category: VisitNoteCategory;
  content: string;
  mood_score?: number;
  pain_score?: number;
  vital_signs?: Record<VitalSign, string>;
  recommendations?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface StartVisitPayload {
  actual_start_time: string;
}

export interface CompleteTaskPayload {
  care_plan_task_id: string;
  status: "completed" | "skipped" | "partially_completed";
  notes?: string;
  skipped_reason?: string;
}

export interface RecordMedicationPayload {
  medication_name: string;
  prescribed_dosage?: string;
  administered_dosage?: string;
  status: MedicationStatus;
  not_given_reason?: string;
  notes?: string;
}

export interface SaveVisitNotePayload {
  category: VisitNoteCategory;
  content: string;
  mood_score?: number;
  pain_score?: number;
  vital_signs?: Record<VitalSign, string>;
  recommendations?: string;
}

export interface CompleteVisitPayload {
  actual_end_time: string;
  notes: string;
  summary?: string;
}

export interface VisitExecutionSummary {
  visit_id: string;
  total_tasks: number;
  completed_tasks: number;
  medications_recorded: number;
  notes_count: number;
  can_complete: boolean;
  missing_requirements: string[];
}
