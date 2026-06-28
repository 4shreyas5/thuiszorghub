import { Timestamp } from "./common";

export interface Notification extends Timestamp {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedResourceId?: string;
  relatedResourceType?: string;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
}

export interface NotificationPreference extends Timestamp {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled?: boolean;
}

export interface NotificationTemplate extends Timestamp {
  id: string;
  organizationId: string;
  type: string;
  title: string;
  messageTemplate: string;
  emailTemplateId?: string;
  isActive: boolean;
}

export interface CreateNotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedResourceId?: string;
  relatedResourceType?: string;
  actionUrl?: string;
}
