export interface Assignment {
  id: string;
  organization_id: string;
  employee_id: string;
  client_id: string;
  assigned_from: string; // DATE
  assigned_until: string | null; // DATE
  is_primary: boolean;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    role_id: string;
    is_active: boolean;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface CreateAssignmentPayload {
  employee_id: string;
  client_id: string;
  assigned_from: string;
  assigned_until?: string | null;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateAssignmentPayload {
  employee_id?: string;
  client_id?: string;
  assigned_from?: string;
  assigned_until?: string | null;
  is_primary?: boolean;
  notes?: string;
}

export interface AssignmentWithRelations extends Assignment {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    role_id: string;
    is_active: boolean;
  };
  client: {
    id: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  };
  branch: {
    id: string;
    name: string;
  };
}
