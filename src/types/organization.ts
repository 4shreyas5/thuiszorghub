import { Timestamp, Locale } from "./common";

export interface Organization extends Timestamp {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  primaryLanguage: Locale;
  timezone: string;
  isActive: boolean;
  subscriptionTier: "starter" | "professional" | "enterprise";
  subscriptionStatus: "active" | "inactive" | "trial" | "suspended";
  maxUsers: number;
  maxBranches: number;
  logoUrl?: string;
}

export interface OrganizationSettings extends Timestamp {
  id: string;
  organizationId: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  workWeekStart: number;
  defaultVisitDuration: number;
}

export interface CreateOrganizationPayload {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  primaryLanguage: Locale;
  timezone: string;
}
