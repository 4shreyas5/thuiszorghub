import { z } from "zod";

// ============================================================================
// INVOICE SCHEMAS
// ============================================================================

export const CreateInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  billingProfileId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        visitId: z.string().uuid().optional(),
        description: z.string().min(1).max(255),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        rateType: z.string().optional(),
        vatPercentage: z.number().min(0).max(100).optional(),
      })
    )
    .min(1),
});

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(["draft", "pending", "sent", "partially_paid", "paid", "overdue", "cancelled"]),
  changedReason: z.string().optional(),
  notes: z.string().optional(),
});

export const InvoiceFilterSchema = z.object({
  status: z
    .enum(["draft", "pending", "sent", "partially_paid", "paid", "overdue", "cancelled"])
    .optional(),
  clientId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(["bank_transfer", "cash", "card", "sepa", "manual_entry"]),
  referenceNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const PaymentFilterSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  paymentMethod: z.enum(["bank_transfer", "cash", "card", "sepa", "manual_entry"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

// ============================================================================
// BILLING PROFILE SCHEMAS
// ============================================================================

export const CreateBillingProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultHourlyRate: z.number().positive(),
  weekendRateMultiplier: z.number().positive().default(1.25),
  holidayRateMultiplier: z.number().positive().default(1.5),
  nightRateMultiplier: z.number().positive().default(1.25),
  vatPercentage: z.number().min(0).max(100).default(21),
  paymentTermsDays: z.number().int().positive().default(30),
  invoicePrefix: z.string().max(20).optional(),
  autoGenerateInvoices: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const UpdateBillingProfileSchema = CreateBillingProfileSchema.partial();

// ============================================================================
// INSURANCE PROVIDER SCHEMAS
// ============================================================================

export const CreateInsuranceProviderSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  contactPerson: z.string().max(150).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
});

// ============================================================================
// MUNICIPALITY CONTRACT SCHEMAS
// ============================================================================

export const CreateMunicipalityContractSchema = z.object({
  municipalityName: z.string().min(1).max(150),
  contractNumber: z.string().min(1).max(100),
  contractType: z.string().min(1).max(50),
  hourlyRate: z.number().positive(),
  weekendRate: z.number().positive().optional(),
  holidayRate: z.number().positive().optional(),
  nightRate: z.number().positive().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  branchId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// TIMESHEET SCHEMAS
// ============================================================================

export const CreateTimesheetSchema = z.object({
  visitId: z.string().uuid(),
  employeeId: z.string().uuid(),
  clientId: z.string().uuid(),
  visitDate: z.coerce.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalHours: z.number().nonnegative().optional(),
  billableHours: z.number().nonnegative().optional(),
  nightHours: z.number().nonnegative().default(0),
  weekendHours: z.number().nonnegative().default(0),
  holidayHours: z.number().nonnegative().default(0),
  travelHours: z.number().nonnegative().default(0),
  cancelledHours: z.number().nonnegative().default(0),
  overtimeHours: z.number().nonnegative().default(0),
  hourlyRate: z.number().nonnegative().optional(),
  rateType: z.string().optional(),
  notes: z.string().optional(),
});

export const TimesheetFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isBilled: z.boolean().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export const ReportFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  branchId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
});

export const ReportExportSchema = z.object({
  format: z.enum(["csv", "excel", "pdf"]),
  reportType: z.enum([
    "employee_hours",
    "client_hours",
    "visit_summary",
    "revenue",
    "outstanding_payments",
    "invoice_status",
    "branch_performance",
    "care_plan_status",
    "scheduling_summary",
  ]),
  filters: ReportFilterSchema.optional(),
});

// ============================================================================
// INVOICE TEMPLATE SCHEMAS
// ============================================================================

export const CreateInvoiceTemplateSchema = z.object({
  name: z.string().min(1).max(150),
  templateType: z.string().min(1),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  notesTemplate: z.string().optional(),
  paymentInstructions: z.string().optional(),
  billingProfileId: z.string().uuid().optional(),
  isDefault: z.boolean().default(false),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateInvoicePayload = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceStatusPayload = z.infer<typeof UpdateInvoiceStatusSchema>;
export type InvoiceFilterPayload = z.infer<typeof InvoiceFilterSchema>;

export type CreatePaymentPayload = z.infer<typeof CreatePaymentSchema>;
export type PaymentFilterPayload = z.infer<typeof PaymentFilterSchema>;

export type CreateBillingProfilePayload = z.infer<typeof CreateBillingProfileSchema>;
export type UpdateBillingProfilePayload = z.infer<typeof UpdateBillingProfileSchema>;

export type CreateInsuranceProviderPayload = z.infer<typeof CreateInsuranceProviderSchema>;
export type CreateMunicipalityContractPayload = z.infer<typeof CreateMunicipalityContractSchema>;

export type CreateTimesheetPayload = z.infer<typeof CreateTimesheetSchema>;
export type TimesheetFilterPayload = z.infer<typeof TimesheetFilterSchema>;

export type ReportFilterPayload = z.infer<typeof ReportFilterSchema>;
export type ReportExportPayload = z.infer<typeof ReportExportSchema>;

export type CreateInvoiceTemplatePayload = z.infer<typeof CreateInvoiceTemplateSchema>;
