import { Timestamp } from "./common";

export interface Branch extends Timestamp {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  city: string;
  postalCode?: string;
  street?: string;
  streetNumber?: string;
  isActive: boolean;
  managerUserId?: string;
}

export interface BranchSettings extends Timestamp {
  id: string;
  branchId: string;
  organizationId: string;
  maxEmployees: number;
  maxClients: number;
  enableScheduling: boolean;
  enableClientPortal: boolean;
}

export interface CreateBranchPayload {
  name: string;
  email?: string;
  phone?: string;
  city: string;
  postalCode?: string;
  street?: string;
  streetNumber?: string;
}
