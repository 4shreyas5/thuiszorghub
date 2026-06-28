import { Timestamp } from "./common";

export interface Subscription extends Timestamp {
  id: string;
  organizationId: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "inactive" | "trial" | "suspended" | "cancelled";
  billingCycleStart: Date;
  billingCycleEnd: Date;
  renewalDate: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface Invoice extends Timestamp {
  id: string;
  organizationId: string;
  subscriptionId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  pdfUrl?: string;
}

export interface BillingContact extends Timestamp {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxId?: string;
}

export interface UsageMetric extends Timestamp {
  id: string;
  organizationId: string;
  metricName: string;
  metricValue: number;
  billingPeriod: Date;
}
