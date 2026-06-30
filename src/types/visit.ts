export type VisitStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
export type VisitPriority = "low" | "normal" | "high" | "urgent";
export type VisitType = "personal_care" | "medication" | "companionship" | "nursing" | "cleaning" | "household" | "assessment" | "custom";

export interface Visit {
  id: string;
  organization_id: string;
  client_id: string;
  employee_id: string | null;
  branch_id: string;
  care_plan_id: string | null;
  title: string;
  visit_type: VisitType;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  estimated_duration_minutes?: number;
  priority: VisitPriority;
  status: VisitStatus;
  notes?: string;
  visit_recurrence_id?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    is_active?: boolean;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    is_active?: boolean;
  };
  branch?: {
    id: string;
    name: string;
  };
  care_plan?: {
    id: string;
    title: string;
    status?: string;
  };
  checklists?: VisitChecklist[];
}

export interface VisitChecklist {
  id: string;
  scheduled_visit_id: string;
  item_title: string;
  item_order?: number;
  is_completed: boolean;
  completed_by_id?: string;
  completed_at?: string;
  notes?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface CreateVisitPayload {
  client_id: string;
  employee_id?: string;
  branch_id: string;
  care_plan_id?: string;
  title: string;
  visit_type: VisitType;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  estimated_duration_minutes?: number;
  priority?: VisitPriority;
  notes?: string;
}

export interface UpdateVisitPayload {
  client_id?: string;
  employee_id?: string;
  branch_id?: string;
  care_plan_id?: string;
  title?: string;
  visit_type?: VisitType;
  description?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  estimated_duration_minutes?: number;
  priority?: VisitPriority;
  status?: VisitStatus;
  notes?: string;
}

export interface CompleteVisitPayload {
  status: "completed" | "no_show" | "cancelled";
  notes?: string;
}
