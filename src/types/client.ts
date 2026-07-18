export type ClientStatus = "active" | "inactive" | "archived";

export interface Client {
  id: string;
  organization_id: string;
  branch_id: string;
  branch?: { id: string; name: string };
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  case_status: "active" | "inactive" | "discharged";
  risk_level?: "low" | "medium" | "high";
  status: ClientStatus;
  is_active: boolean;
  notes?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  addresses?: ClientAddress[];
  insurance?: ClientInsurance[];
  contacts?: ClientContact[];
  medical_info?: ClientMedicalInfo | null;
  allergies?: ClientAllergy[];
  assignments?: {
    is_primary: boolean;
    employee: { first_name: string; last_name: string } | null;
  }[];
}

export interface ClientMedicalInfo {
  id: string;
  client_id: string;
  blood_type?: string;
  mobility_status?: string;
  cognitive_status?: string;
  hearing_status?: string;
  vision_status?: string;
  special_needs?: string;
}

export interface ClientAllergy {
  id: string;
  client_id: string;
  allergen: string;
  reaction?: string;
  severity?: string;
}

export interface ClientAddress {
  id: string;
  client_id: string;
  address_type: "primary" | "secondary";
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
}

export interface ClientContact {
  id: string;
  client_id: string;
  contact_type: string;
  first_name: string;
  last_name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
}

export interface ClientInsurance {
  id: string;
  client_id: string;
  insurance_provider?: string;
  policy_number?: string;
  member_id?: string;
  effective_date?: string;
  expiry_date?: string;
  coverage_type?: string;
  created_at: string;
}

export interface CreateClientPayload {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  branch_id: string;
  case_status: "active" | "inactive" | "discharged";
  risk_level?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  insurance_provider?: string;
  policy_number?: string;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  status?: ClientStatus;
  is_active?: boolean;
}
