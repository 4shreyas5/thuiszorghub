import { createServerClient } from "@/core/database/server";
import { isWeekend, isHoliday } from "@/utils/date-utils";

interface ScheduledVisitData {
  id: string;
  client_id: string;
  employee_id: string;
  branch_id: string;
  visit_type: string;
  care_plan_id?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
}

interface VisitExecutionData {
  id: string;
  scheduled_visit_id: string;
  completed_at: string;
  actual_duration_minutes?: number;
  billable_duration_minutes?: number;
  status: string;
  scheduled_visits: ScheduledVisitData;
}

interface InvoiceItemData {
  visitId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  rateType: string;
  vatPercentage: number;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  appliedRules: string[];
}

interface BillingRules {
  baseHourlyRate: number;
  employeeHourlyRate?: number;
  branchOverride?: number;
  weekendMultiplier: number;
  nightMultiplier: number;
  holidayMultiplier: number;
  municipalityRate?: number;
  insuranceRate?: number;
  clientOverride?: number;
  vatPercentage: number;
}

interface BillingContext {
  organizationId: string;
  visitId: string;
  clientId: string;
  employeeId: string;
  branchId: string;
  visitDate: Date;
  startTime: Date;
  endTime: Date;
  visitType: string;
  carePlanId?: string | undefined;
}

interface CalculatedRate {
  baseRate: number;
  weekendMultiplier: number;
  nightMultiplier: number;
  holidayMultiplier: number;
  finalRate: number;
  rateType: string;
  appliedRules: string[];
}

interface BillingProfileRow {
  default_hourly_rate: number | null;
  weekend_rate_multiplier: number | null;
  night_rate_multiplier: number | null;
  holiday_rate_multiplier: number | null;
  vat_percentage: number | null;
}

interface ClientOverrideRow {
  hourly_rate: number;
}

interface ClientExistsRow {
  id: string;
}

interface ClientInsuranceRow {
  insurance_provider: string;
}

interface InsuranceRateRow {
  hourly_rate: number;
}

interface MunicipalityContractRow {
  hourly_rate: number;
  weekend_rate: number | null;
  holiday_rate: number | null;
  night_rate: number | null;
}

interface BranchRateRow {
  billing_hourly_rate: number | null;
}

interface EmployeeRateRow {
  hourly_rate: number | null;
}

export class BillingEngine {
  private supabase: Awaited<ReturnType<typeof createServerClient>>;

  // Per-instance lookup caches for resolveBillingRules(). A fresh
  // BillingEngine is created per request (see route handlers below), so
  // these are safely scoped to a single request - no reference table is
  // written to mid-request, so a cached read is always identical to a
  // fresh one. This turns the up-to-7-queries-per-visit chain in
  // generateInvoiceDraft into at most one query per distinct
  // org/client/branch/employee/date encountered across the whole batch.
  private billingProfileCache = new Map<string, BillingProfileRow | null>();
  private clientOverrideCache = new Map<string, ClientOverrideRow | null>();
  private clientExistsCache = new Map<string, ClientExistsRow | null>();
  private clientInsuranceCache = new Map<string, ClientInsuranceRow | null>();
  private insuranceRateCache = new Map<string, InsuranceRateRow | null>();
  private municipalityContractCache = new Map<string, MunicipalityContractRow | null>();
  private branchRateCache = new Map<string, BranchRateRow | null>();
  private employeeRateCache = new Map<string, EmployeeRateRow | null>();

  constructor(supabase: Awaited<ReturnType<typeof createServerClient>>) {
    this.supabase = supabase;
  }

  private async cachedLookup<T>(
    cache: Map<string, T | null>,
    key: string,
    fetcher: () => Promise<T | null>
  ): Promise<T | null> {
    if (cache.has(key)) {
      return cache.get(key) ?? null;
    }
    const value = await fetcher();
    cache.set(key, value);
    return value;
  }

  /**
   * Resolve billing rules in priority order:
   * 1. Client-specific override
   * 2. Insurance contract
   * 3. Municipality contract
   * 4. Branch override
   * 5. Employee hourly rate
   * 6. Default hourly rate
   */
  async resolveBillingRules(context: BillingContext): Promise<BillingRules> {
    const { organizationId, clientId, employeeId, branchId, visitDate } = context;

    const billingProfile = await this.cachedLookup(
      this.billingProfileCache,
      organizationId,
      async () => {
        const { data } = await this.supabase
          .from("billing_profiles")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("is_deleted", false)
          .single();
        return (data as BillingProfileRow) ?? null;
      }
    );

    const baseRules: BillingRules = {
      baseHourlyRate: billingProfile?.default_hourly_rate || 25,
      weekendMultiplier: billingProfile?.weekend_rate_multiplier || 1.25,
      nightMultiplier: billingProfile?.night_rate_multiplier || 1.25,
      holidayMultiplier: billingProfile?.holiday_rate_multiplier || 1.5,
      vatPercentage: billingProfile?.vat_percentage || 21,
    };

    // Check client-specific override
    const clientOverride = await this.cachedLookup(this.clientOverrideCache, clientId, async () => {
      const { data } = await this.supabase
        .from("client_billing_overrides")
        .select("hourly_rate")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .maybeSingle();
      return data;
    });

    if (clientOverride) {
      return { ...baseRules, clientOverride: clientOverride.hourly_rate };
    }

    // Check client insurance
    const clientData = await this.cachedLookup(this.clientExistsCache, clientId, async () => {
      const { data } = await this.supabase.from("clients").select("id").eq("id", clientId).single();
      return data;
    });

    if (clientData) {
      const insurance = await this.cachedLookup(this.clientInsuranceCache, clientId, async () => {
        const { data } = await this.supabase
          .from("client_insurance")
          .select("insurance_provider")
          .eq("client_id", clientId)
          .eq("is_deleted", false)
          .maybeSingle();
        return data;
      });

      if (insurance) {
        const insuranceRate = await this.cachedLookup(
          this.insuranceRateCache,
          `${insurance.insurance_provider}:${organizationId}`,
          async () => {
            const { data } = await this.supabase
              .from("insurance_contracts")
              .select("hourly_rate")
              .eq("insurance_provider", insurance.insurance_provider)
              .eq("organization_id", organizationId)
              .eq("is_active", true)
              .eq("is_deleted", false)
              .maybeSingle();
            return data;
          }
        );

        if (insuranceRate) {
          return { ...baseRules, insuranceRate: insuranceRate.hourly_rate };
        }
      }
    }

    // Check municipality contract
    const dateStr = visitDate.toISOString().split("T")[0];
    const municipalityContract = await this.cachedLookup(
      this.municipalityContractCache,
      `${branchId}:${organizationId}:${dateStr}`,
      async () => {
        const { data } = await this.supabase
          .from("municipality_contracts")
          .select("hourly_rate, weekend_rate, holiday_rate, night_rate")
          .eq("branch_id", branchId)
          .eq("organization_id", organizationId)
          .lte("start_date", dateStr)
          .or(`end_date.is.null,end_date.gte.${dateStr}`)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .maybeSingle();
        return data;
      }
    );

    if (municipalityContract) {
      return {
        ...baseRules,
        municipalityRate: municipalityContract.hourly_rate,
        weekendMultiplier: municipalityContract.weekend_rate
          ? municipalityContract.weekend_rate / municipalityContract.hourly_rate
          : baseRules.weekendMultiplier,
        nightMultiplier: municipalityContract.night_rate
          ? municipalityContract.night_rate / municipalityContract.hourly_rate
          : baseRules.nightMultiplier,
        holidayMultiplier: municipalityContract.holiday_rate
          ? municipalityContract.holiday_rate / municipalityContract.hourly_rate
          : baseRules.holidayMultiplier,
      };
    }

    // Check branch override
    const branch = await this.cachedLookup(this.branchRateCache, branchId, async () => {
      const { data } = await this.supabase
        .from("branches")
        .select("billing_hourly_rate")
        .eq("id", branchId)
        .maybeSingle();
      return data;
    });

    if (branch?.billing_hourly_rate) {
      return { ...baseRules, branchOverride: branch.billing_hourly_rate };
    }

    // Check employee hourly rate
    const employee = await this.cachedLookup(this.employeeRateCache, employeeId, async () => {
      const { data } = await this.supabase
        .from("employees")
        .select("hourly_rate")
        .eq("id", employeeId)
        .maybeSingle();
      return data;
    });

    if (employee?.hourly_rate) {
      return { ...baseRules, employeeHourlyRate: employee.hourly_rate };
    }

    return baseRules;
  }

  /**
   * Calculate the effective hourly rate based on time of day
   */
  calculateEffectiveRate(
    rules: BillingRules,
    visitDate: Date,
    startTime: Date,
    endTime: Date
  ): CalculatedRate {
    void endTime;
    const appliedRules: string[] = [];

    let baseRate = rules.baseHourlyRate;

    if (rules.clientOverride) {
      baseRate = rules.clientOverride;
      appliedRules.push("client_override");
    } else if (rules.insuranceRate) {
      baseRate = rules.insuranceRate;
      appliedRules.push("insurance_contract");
    } else if (rules.municipalityRate) {
      baseRate = rules.municipalityRate;
      appliedRules.push("municipality_contract");
    } else if (rules.branchOverride) {
      baseRate = rules.branchOverride;
      appliedRules.push("branch_override");
    } else if (rules.employeeHourlyRate) {
      baseRate = rules.employeeHourlyRate;
      appliedRules.push("employee_hourly_rate");
    } else {
      appliedRules.push("default_hourly_rate");
    }

    let weekendMultiplier = 1;
    let nightMultiplier = 1;
    let holidayMultiplier = 1;
    let rateType = "standard";

    if (isHoliday(visitDate)) {
      holidayMultiplier = rules.holidayMultiplier;
      rateType = "holiday";
      appliedRules.push("holiday_multiplier");
    } else if (isWeekend(visitDate)) {
      weekendMultiplier = rules.weekendMultiplier;
      rateType = "weekend";
      appliedRules.push("weekend_multiplier");
    }

    // Check for night hours (22:00 - 06:00)
    const hour = startTime.getHours();
    if (hour >= 22 || hour < 6) {
      nightMultiplier = rules.nightMultiplier;
      rateType = "night";
      appliedRules.push("night_multiplier");
    }

    const finalRate = baseRate * weekendMultiplier * nightMultiplier * holidayMultiplier;

    return {
      baseRate,
      weekendMultiplier,
      nightMultiplier,
      holidayMultiplier,
      finalRate,
      rateType,
      appliedRules,
    };
  }

  /**
   * Create or update invoice draft from completed visits
   */
  async generateInvoiceDraft(
    organizationId: string,
    clientId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    branchId?: string
  ) {
    try {
      const periodStartStr = billingPeriodStart.toISOString().split("T")[0];
      const periodEndStr = billingPeriodEnd.toISOString().split("T")[0];

      // Get all completed visits for the period
      let query = this.supabase
        .from("visit_executions")
        .select(
          `
          id,
          scheduled_visit_id,
          completed_at,
          actual_duration_minutes,
          billable_duration_minutes,
          scheduled_visits(
            id,
            client_id,
            employee_id,
            branch_id,
            visit_type,
            care_plan_id,
            scheduled_date,
            start_time,
            end_time
          )
        `
        )
        .eq("status", "completed")
        .eq("organization_id", organizationId)
        .gte("completed_at", `${periodStartStr}T00:00:00Z`)
        .lte("completed_at", `${periodEndStr}T23:59:59Z`);

      if (branchId) {
        query = query.eq("scheduled_visits.branch_id", branchId);
      }

      const { data: completedVisits, error } = await query;

      if (error) {
        console.error("Error fetching completed visits:", error);
        throw error;
      }

      // Filter to client
      const visitsByClient =
        (completedVisits as unknown as VisitExecutionData[])?.filter(
          (v) => v.scheduled_visits?.client_id === clientId
        ) || [];

      if (visitsByClient.length === 0) {
        return null;
      }

      // Check if invoice already exists for this period
      const existingInvoice = await this.supabase
        .from("invoices")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("client_id", clientId)
        .eq("period_start", periodStartStr)
        .eq("period_end", periodEndStr)
        .eq("status", "draft")
        .eq("is_deleted", false)
        .maybeSingle();

      let invoiceId: string;

      // Process each visit and calculate billing. Rate resolution per visit
      // is I/O-bound (resolveBillingRules) and independent across visits -
      // running them concurrently instead of one-at-a-time collapses the
      // wall-clock cost to roughly the slowest single lookup instead of the
      // sum of all of them. Promise.all preserves array order regardless of
      // resolution order, so item ordering (and line_number below) is
      // unaffected.
      const items: InvoiceItemData[] = await Promise.all(
        visitsByClient.map(async (visit) => {
          const scheduled = visit.scheduled_visits;
          const billableMinutes = visit.billable_duration_minutes || 0;
          const billableHours = billableMinutes / 60;

          // Resolve billing rules
          const rules = await this.resolveBillingRules({
            organizationId,
            visitId: visit.id as string,
            clientId,
            employeeId: String(scheduled?.employee_id || ""),
            branchId: String(scheduled?.branch_id || ""),
            visitDate: new Date(String(scheduled?.scheduled_date || "")),
            startTime: new Date(
              `${String(scheduled?.scheduled_date || "")}T${String(scheduled?.start_time || "")}`
            ),
            endTime: new Date(
              `${String(scheduled?.scheduled_date || "")}T${String(scheduled?.end_time || "")}`
            ),
            visitType: String(scheduled?.visit_type || ""),
            carePlanId: scheduled?.care_plan_id as string | undefined,
          });

          // Calculate rate
          const rateCalc = this.calculateEffectiveRate(
            rules,
            new Date(scheduled.scheduled_date),
            new Date(`${scheduled.scheduled_date}T${scheduled.start_time}`),
            new Date(`${scheduled.scheduled_date}T${scheduled.end_time}`)
          );

          const itemSubtotal = billableHours * rateCalc.finalRate;
          const itemVat = itemSubtotal * (rules.vatPercentage / 100);
          const itemTotal = itemSubtotal + itemVat;

          return {
            visitId: scheduled.id,
            description: `${scheduled.visit_type} - ${new Date(
              scheduled.scheduled_date
            ).toLocaleDateString("nl-NL")}`,
            quantity: billableHours,
            unitPrice: rateCalc.finalRate,
            rateType: rateCalc.rateType,
            vatPercentage: rules.vatPercentage,
            subtotal: itemSubtotal,
            vat_amount: itemVat,
            total_amount: itemTotal,
            appliedRules: rateCalc.appliedRules,
          };
        })
      );

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const vatAmount = items.reduce((sum, item) => sum + item.vat_amount, 0);

      if (existingInvoice.data) {
        // Update existing draft invoice
        invoiceId = existingInvoice.data.id;

        const { error: updateError } = await this.supabase
          .from("invoices")
          .update({
            subtotal,
            vat_amount: vatAmount,
            total_amount: subtotal + vatAmount,
            remaining_balance: subtotal + vatAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        if (updateError) throw updateError;

        // Remove old items
        await this.supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      } else {
        // Create new invoice
        const invoiceNumber = `INV-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`;

        const dueDate = new Date(billingPeriodEnd);
        dueDate.setDate(dueDate.getDate() + 30);

        const { data: newInvoice, error: createError } = await this.supabase
          .from("invoices")
          .insert({
            organization_id: organizationId,
            branch_id: branchId,
            client_id: clientId,
            invoice_number: invoiceNumber,
            invoice_date: new Date().toISOString().split("T")[0],
            due_date: dueDate.toISOString().split("T")[0],
            period_start: periodStartStr,
            period_end: periodEndStr,
            subtotal,
            vat_amount: vatAmount,
            vat_percentage: 21,
            total_amount: subtotal + vatAmount,
            remaining_balance: subtotal + vatAmount,
            status: "draft",
            currency: "EUR",
          })
          .select()
          .single();

        if (createError) throw createError;
        invoiceId = newInvoice.id;
      }

      // Insert all invoice items in a single batched insert instead of one
      // round trip per item, then link each item's timesheet concurrently
      // (each update targets a distinct visit_id, so they're independent).
      // Note: batching makes this all-or-nothing on a DB-level failure,
      // whereas the previous per-item loop would skip a single bad row and
      // continue - see the Sprint 2 report for why this is disclosed as an
      // intentional tradeoff rather than silently changed.
      if (items.length > 0) {
        const { data: insertedItems, error: itemsError } = await this.supabase
          .from("invoice_items")
          .insert(
            items.map((item, i) => ({
              organization_id: organizationId,
              invoice_id: invoiceId,
              visit_id: item.visitId,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              rate_type: item.rateType,
              vat_percentage: item.vatPercentage,
              subtotal: item.subtotal,
              vat_amount: item.vat_amount,
              total_amount: item.total_amount,
              line_number: i + 1,
            }))
          )
          .select();

        if (itemsError) {
          console.error("Error inserting invoice items:", itemsError);
        } else {
          // Link the matching timesheet to this invoice so the existing
          // mark_timesheets_billed trigger (migration 010) can flip
          // is_billed once the invoice status advances past draft.
          await Promise.all(
            (insertedItems || []).map((insertedItem) =>
              this.supabase
                .from("timesheets")
                .update({ invoice_id: invoiceId, invoice_line_item_id: insertedItem.id })
                .eq("visit_id", insertedItem.visit_id)
                .eq("organization_id", organizationId)
            )
          );
        }
      }

      return invoiceId;
    } catch (error) {
      console.error("Error generating invoice draft:", error);
      throw error;
    }
  }

  /**
   * Create timesheet from visit execution
   */
  async createTimesheetFromVisit(
    organizationId: string,
    visitExecutionId: string,
    // Pass a known timesheet id (or null if known not to exist) to skip the
    // internal existence check below - lets a caller that's already
    // batch-fetched existing timesheets for many visits (see
    // POST /api/billing/timesheets/from-visits) avoid re-querying per visit.
    // Leave undefined to preserve the original always-check behavior.
    knownExistingTimesheetId?: string | null
  ) {
    try {
      // Get visit execution and scheduled visit details
      const { data: execution, error: execError } = await this.supabase
        .from("visit_executions")
        .select(
          `
          id,
          scheduled_visit_id,
          actual_start_time,
          actual_end_time,
          actual_duration_minutes,
          billable_duration_minutes,
          scheduled_visits(
            id,
            client_id,
            employee_id,
            branch_id,
            scheduled_date,
            visit_type
          )
        `
        )
        .eq("id", visitExecutionId)
        .single();

      if (execError || !execution) {
        throw execError || new Error("Visit execution not found");
      }

      const scheduled = (execution as unknown as VisitExecutionData).scheduled_visits;
      const visitDate = scheduled.scheduled_date;
      const billableHours = (execution.billable_duration_minutes || 0) / 60;

      // Calculate hour breakdowns
      const startHour = execution.actual_start_time
        ? parseInt(execution.actual_start_time.split(":")[0])
        : 0;
      const nightHours = startHour >= 22 || startHour < 6 ? billableHours : 0;
      const weekendHours = isWeekend(new Date(visitDate)) ? billableHours : 0;
      const holidayHours = isHoliday(new Date(visitDate)) ? billableHours : 0;

      // Get employee hourly rate
      const { data: employee } = await this.supabase
        .from("employees")
        .select("hourly_rate")
        .eq("id", scheduled.employee_id)
        .single();

      // Check for existing timesheet, unless the caller already knows
      // (see knownExistingTimesheetId above).
      let existingTimesheetId: string | null;
      if (knownExistingTimesheetId !== undefined) {
        existingTimesheetId = knownExistingTimesheetId;
      } else {
        const { data: existingTimesheet } = await this.supabase
          .from("timesheets")
          .select("id")
          .eq("visit_id", scheduled.id)
          .eq("is_deleted", false)
          .maybeSingle();
        existingTimesheetId = existingTimesheet?.id ?? null;
      }

      const timesheetData = {
        organization_id: organizationId,
        visit_id: scheduled.id,
        employee_id: scheduled.employee_id,
        client_id: scheduled.client_id,
        visit_date: visitDate,
        start_time: execution.actual_start_time,
        end_time: execution.actual_end_time,
        total_hours: execution.actual_duration_minutes / 60,
        billable_hours: billableHours,
        night_hours: nightHours,
        weekend_hours: weekendHours,
        holiday_hours: holidayHours,
        hourly_rate: employee?.hourly_rate || 25,
        rate_type: "standard",
        is_billed: false,
      };

      if (existingTimesheetId) {
        // Update existing
        await this.supabase.from("timesheets").update(timesheetData).eq("id", existingTimesheetId);

        return existingTimesheetId;
      } else {
        // Create new
        const { data: newTimesheet, error: tsError } = await this.supabase
          .from("timesheets")
          .insert(timesheetData)
          .select()
          .single();

        if (tsError) throw tsError;
        return newTimesheet.id;
      }
    } catch (error) {
      console.error("Error creating timesheet:", error);
      throw error;
    }
  }

  /**
   * Record payment and update invoice balance
   */
  async recordPayment(
    organizationId: string,
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    paymentDate: Date,
    referenceNumber?: string,
    notes?: string
  ) {
    try {
      // Get invoice
      const { data: invoice, error: invError } = await this.supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .eq("organization_id", organizationId)
        .single();

      if (invError || !invoice) {
        throw new Error("Invoice not found");
      }

      // Validate payment amount
      const remainingBalance = invoice.total_amount - invoice.paid_amount;
      if (amount > remainingBalance) {
        throw new Error(
          `Payment amount (€${amount}) exceeds remaining balance (€${remainingBalance})`
        );
      }

      // Create payment record
      const { data: payment, error: payError } = await this.supabase
        .from("payments")
        .insert({
          organization_id: organizationId,
          invoice_id: invoiceId,
          amount,
          payment_method: paymentMethod,
          payment_date: paymentDate.toISOString().split("T")[0],
          reference_number: referenceNumber,
          notes,
          status: "completed",
        })
        .select()
        .single();

      if (payError) throw payError;

      // Update invoice
      const newPaidAmount = invoice.paid_amount + amount;
      const newRemainingBalance = invoice.total_amount - newPaidAmount;
      const newStatus =
        newRemainingBalance === 0
          ? "paid"
          : newRemainingBalance < invoice.total_amount
            ? "partially_paid"
            : "sent";

      await this.supabase
        .from("invoices")
        .update({
          paid_amount: newPaidAmount,
          remaining_balance: newRemainingBalance,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      return payment;
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  }

  /**
   * Update invoice status with audit trail
   */
  async updateInvoiceStatus(
    organizationId: string,
    invoiceId: string,
    newStatus: string,
    reason?: string,
    notes?: string
  ) {
    try {
      // Get current invoice
      const { data: invoice, error: invError } = await this.supabase
        .from("invoices")
        .select("status")
        .eq("id", invoiceId)
        .eq("organization_id", organizationId)
        .single();

      if (invError || !invoice) {
        throw new Error("Invoice not found");
      }

      const oldStatus = invoice.status;

      // Update status
      await this.supabase
        .from("invoices")
        .update({
          status: newStatus,
          sent_at: newStatus === "sent" ? new Date().toISOString() : undefined,
          paid_at: newStatus === "paid" ? new Date().toISOString() : undefined,
          cancelled_at: newStatus === "cancelled" ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      // Log status change
      await this.supabase.from("invoice_status_history").insert({
        organization_id: organizationId,
        invoice_id: invoiceId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_reason: reason,
        notes,
      });

      return { oldStatus, newStatus };
    } catch (error) {
      console.error("Error updating invoice status:", error);
      throw error;
    }
  }
}
