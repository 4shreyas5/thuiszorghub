export type CarePlanStatus = "draft" | "active" | "on_hold" | "completed" | "archived";
export type CarePlanPriority = "low" | "normal" | "high" | "urgent";
export type GoalStatus = "active" | "completed" | "archived" | "paused";
export type GoalPriority = "low" | "normal" | "high" | "urgent";
export type TaskTimeCategory = "morning" | "afternoon" | "evening" | "night" | "prn" | "custom";
export type TaskType = "care" | "medication" | "assessment" | "therapy" | "social" | "other";
export type ReviewStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type TaskExecutionStatus = "pending" | "completed" | "skipped" | "cancelled";

export interface CarePlan {
  id: string;
  organization_id: string;
  branch_id: string;
  client_id: string;
  primary_caregiver_id?: string;
  created_by_id: string;
  title: string;
  description?: string;
  assessment_notes?: string;
  status: CarePlanStatus;
  priority: CarePlanPriority;
  start_date: string;
  review_date?: string;
  end_date?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  primary_caregiver?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  goals?: CarePlanGoal[];
  tasks?: CarePlanTask[];
  reviews?: CarePlanReview[];
}

export interface CarePlanGoal {
  id: string;
  care_plan_id: string;
  goal_statement: string;
  priority: GoalPriority;
  target_date?: string;
  completion_percentage: number;
  status: GoalStatus;
  notes?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CarePlanTask {
  id: string;
  care_plan_id: string;
  task_title: string;
  task_type: TaskType;
  time_category: TaskTimeCategory;
  estimated_duration_minutes?: number;
  instructions?: string;
  is_checklist: boolean;
  checklist_items?: Record<string, unknown>[];
  assigned_to_employee_id?: string;
  start_date: string;
  end_date?: string;
  frequency?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  assigned_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CarePlanReview {
  id: string;
  care_plan_id: string;
  scheduled_date: string;
  completed_date?: string;
  reviewer_id?: string;
  outcome?: string;
  recommendations?: string;
  status: ReviewStatus;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CarePlanDocument {
  id: string;
  care_plan_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  uploaded_by_id?: string;
  upload_date: string;
  expiry_date?: string;
  is_verified: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface CreateCarePlanPayload {
  client_id: string;
  branch_id: string;
  primary_caregiver_id?: string;
  title: string;
  description?: string;
  assessment_notes?: string;
  status: CarePlanStatus;
  priority: CarePlanPriority;
  start_date: string;
  review_date?: string;
  end_date?: string;
}

export type UpdateCarePlanPayload = Partial<CreateCarePlanPayload>;

export interface CreateGoalPayload {
  care_plan_id: string;
  goal_statement: string;
  priority: GoalPriority;
  target_date?: string;
  notes?: string;
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {
  completion_percentage?: number;
  status?: GoalStatus;
}

export interface CreateTaskPayload {
  care_plan_id: string;
  task_title: string;
  task_type: TaskType;
  time_category: TaskTimeCategory;
  estimated_duration_minutes?: number;
  instructions?: string;
  is_checklist?: boolean;
  checklist_items?: Record<string, unknown>[];
  assigned_to_employee_id?: string;
  start_date: string;
  end_date?: string;
  frequency?: string;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface CreateReviewPayload {
  care_plan_id: string;
  scheduled_date: string;
  outcome?: string;
  recommendations?: string;
}

export interface CompleteReviewPayload {
  outcome?: string;
  recommendations?: string;
  status: ReviewStatus;
}
