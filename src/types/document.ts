import { Timestamp } from "./common";

export interface Document extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  fileMimeType: string;
  uploadedBy: string;
  category: string;
  relatedClientId?: string;
  relatedEmployeeId?: string;
  relatedVisitId?: string;
  visibility: "private" | "branch" | "organization";
  expiresAt?: Date;
}

export interface DocumentAccess extends Timestamp {
  id: string;
  documentId: string;
  organizationId: string;
  userId: string;
  accessLevel: "view" | "edit" | "download";
  grantedBy: string;
  revokedAt?: Date;
}

export interface CreateDocumentPayload {
  title: string;
  description?: string;
  category: string;
  visibility: "private" | "branch" | "organization";
  relatedClientId?: string;
  relatedEmployeeId?: string;
  relatedVisitId?: string;
  expiresAt?: Date;
}
