import { Timestamp } from "./common";

// ============================================================================
// SAAS SUBSCRIPTIONS (Platform billing)
// ============================================================================

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

export interface UsageMetric extends Timestamp {
  id: string;
  organizationId: string;
  metricName: string;
  metricValue: number;
  billingPeriod: Date;
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

// ============================================================================
// SERVICE INVOICING (Client/Care billing)
// ============================================================================

export interface Invoice extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  clientId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  periodStart?: Date;
  periodEnd?: Date;
  currency: string;
  subtotal: number;
  vatAmount: number;
  vatPercentage: number;
  discountAmount?: number;
  discountDescription?: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: InvoiceStatus;
  billingProfileId?: string;
  templateId?: string;
  notes?: string;
  internalNotes?: string;
  sentAt?: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  createdBy: string;
  updatedBy: string;
}

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface InvoiceItem extends Timestamp {
  id: string;
  organizationId: string;
  invoiceId: string;
  visitId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  rateType?: string;
  vatPercentage?: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  lineNumber?: number;
  createdBy: string;
}

export interface InvoiceStatusHistory extends Timestamp {
  id: string;
  organizationId: string;
  invoiceId: string;
  oldStatus?: InvoiceStatus;
  newStatus: InvoiceStatus;
  changedReason?: string;
  notes?: string;
  createdBy?: string;
}

// ============================================================================
// PAYMENTS
// ============================================================================

export interface Payment extends Timestamp {
  id: string;
  organizationId: string;
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankAccount?: string;
  transactionId?: string;
  status: PaymentStatus;
  notes?: string;
  internalNotes?: string;
  createdBy: string;
  updatedBy: string;
}

export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "card"
  | "sepa"
  | "manual_entry";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// ============================================================================
// BILLING PROFILES & RULES
// ============================================================================

export interface BillingProfile extends Timestamp {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  defaultHourlyRate: number;
  weekendRateMultiplier: number;
  holidayRateMultiplier: number;
  nightRateMultiplier: number;
  vatPercentage: number;
  paymentTermsDays: number;
  invoicePrefix?: string;
  autoGenerateInvoices: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface BillingRule {
  type: BillingRuleType;
  multiplier: number;
  applicableHours?: string[];
  applicableDays?: string[];
  description?: string;
}

export type BillingRuleType =
  | "default_hourly_rate"
  | "weekend_rate"
  | "holiday_rate"
  | "night_rate"
  | "branch_specific_rate"
  | "client_specific_rate"
  | "insurance_rate"
  | "municipality_rate";

// ============================================================================
// INSURANCE & CONTRACTS
// ============================================================================

export interface InsuranceProvider extends Timestamp {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface MunicipalityContract extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  municipalityName: string;
  contractNumber: string;
  contractType: string;
  hourlyRate: number;
  weekendRate?: number;
  holidayRate?: number;
  nightRate?: number;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// INVOICE TEMPLATES
// ============================================================================

export interface InvoiceTemplate extends Timestamp {
  id: string;
  organizationId: string;
  billingProfileId?: string;
  name: string;
  templateType: string;
  headerText?: string;
  footerText?: string;
  notesTemplate?: string;
  paymentInstructions?: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// TIMESHEETS
// ============================================================================

export interface Timesheet extends Timestamp {
  id: string;
  organizationId: string;
  visitId: string;
  employeeId: string;
  clientId: string;
  visitDate: Date;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  billableHours?: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
  travelHours: number;
  cancelledHours: number;
  overtimeHours: number;
  hourlyRate?: number;
  rateType: string;
  notes?: string;
  isBilled: boolean;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// FINANCIAL SUMMARY (Dashboard)
// ============================================================================

export interface FinancialSummary extends Timestamp {
  id: string;
  organizationId: string;
  branchId?: string;
  summaryDate: Date;
  revenueToday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  outstandingInvoicesCount: number;
  outstandingAmount: number;
  overdueInvoicesCount: number;
  overdueAmount: number;
  paidInvoicesCount: number;
  paidAmount: number;
  billableHoursToday: number;
  billableHoursThisMonth: number;
  clientsServedToday: number;
  clientsServedThisMonth: number;
  visitsCompletedToday: number;
  visitsCompletedThisMonth: number;
}

// ============================================================================
// REPORTS
// ============================================================================

export interface EmployeeHoursReport {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  billableHours: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
  overtimeHours: number;
  totalEarnings: number;
}

export interface ClientHoursReport {
  clientId: string;
  clientName: string;
  totalHours: number;
  billableHours: number;
  totalCost: number;
  numberOfVisits: number;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  invoicesIssued: number;
  invoicesPaid: number;
  outstandingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
}

export interface BranchPerformanceReport {
  branchId: string;
  branchName: string;
  totalRevenue: number;
  billableHours: number;
  employeeCount: number;
  clientCount: number;
  visitCount: number;
  averageHourlyRate: number;
}

export interface OutstandingPaymentsReport {
  invoiceNumber: string;
  clientName: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  daysOverdue: number;
  status: InvoiceStatus;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  branchId?: string;
  employeeId?: string;
  clientId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ReportExportFormat {
  format: "csv" | "excel" | "pdf";
  filename: string;
}
