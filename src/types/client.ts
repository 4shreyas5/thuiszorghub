import { Timestamp, Locale } from "./common";

export interface Client extends Timestamp {
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
  caseNumber?: string;
  caseStatus: "active" | "inactive" | "discharged";
  careLevel: string;
  preferredLanguage: Locale;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  isActive: boolean;
  profileImageUrl?: string;
  notes?: string;
}

export interface ClientCareNeeds extends Timestamp {
  id: string;
  clientId: string;
  organizationId: string;
  category: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface ClientVisitPreferences extends Timestamp {
  id: string;
  clientId: string;
  organizationId: string;
  preferredEmployees?: string[];
  preferredTimeSlots?: string[];
  visitFrequency: string;
  minimumNotice: number;
  canReassignVisits: boolean;
  notes?: string;
}

export interface CreateClientPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  caseNumber?: string;
  careLevel: string;
  preferredLanguage: Locale;
  branchId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}
