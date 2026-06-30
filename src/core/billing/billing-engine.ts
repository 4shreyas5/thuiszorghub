import { createServerClient } from "@/core/database/server";
import { isWeekend, isHoliday } from "@/utils/date-utils";

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
  carePlanId?: string;
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

export class BillingEngine {
  private supabase: Awaited<ReturnType<typeof createServerClient>>;

  constructor(supabase: Awaited<ReturnType<typeof createServerClient>>) {
    this.supabase = supabase;
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

    const { data: billingProfile } = await this.supabase
      .from("billing_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .single();

    const baseRules: BillingRules = {
      baseHourlyRate: billingProfile?.default_hourly_rate || 25,
      weekendMultiplier: billingProfile?.weekend_rate_multiplier || 1.25,
      nightMultiplier: billingProfile?.night_rate_multiplier || 1.25,
      holidayMultiplier: billingProfile?.holiday_rate_multiplier || 1.5,
      vatPercentage: billingProfile?.vat_percentage || 21,
    };

    // Check client-specific override
    const { data: clientOverride } = await this.supabase
      .from("client_billing_overrides")
      .select("hourly_rate")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .maybeSingle();

    if (clientOverride) {
      return { ...baseRules, clientOverride: clientOverride.hourly_rate };
    }

    // Check client insurance
    const { data: clientData } = await this.supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (clientData) {
      const { data: insurance } = await this.supabase
        .from("client_insurance")
        .select("insurance_provider")
        .eq("client_id", clientId)
        .eq("is_deleted", false)
        .maybeSingle();

      if (insurance) {
        const { data: insuranceRate } = await this.supabase
          .from("insurance_contracts")
          .select("hourly_rate")
          .eq("insurance_provider", insurance.insurance_provider)
          .eq("organization_id", organizationId)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .maybeSingle();

        if (insuranceRate) {
          return { ...baseRules, insuranceRate: insuranceRate.hourly_rate };
        }
      }
    }

    // Check municipality contract
    const dateStr = visitDate.toISOString().split("T")[0];
    const { data: municipalityContract } = await this.supabase
      .from("municipality_contracts")
      .select("hourly_rate, weekend_rate, holiday_rate, night_rate")
      .eq("branch_id", branchId)
      .eq("organization_id", organizationId)
      .lte("start_date", dateStr)
      .or(`end_date.is.null,end_date.gte.${dateStr}`)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .maybeSingle();

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
    const { data: branch } = await this.supabase
      .from("branches")
      .select("billing_hourly_rate")
      .eq("id", branchId)
      .maybeSingle();

    if (branch?.billing_hourly_rate) {
      return { ...baseRules, branchOverride: branch.billing_hourly_rate };
    }

    // Check employee hourly rate
    const { data: employee } = await this.supabase
      .from("employees")
      .select("hourly_rate")
      .eq("id", employeeId)
      .maybeSingle();

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
    _endTime: Date
  ): CalculatedRate {
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

    const finalRate =
      baseRate * weekendMultiplier * nightMultiplier * holidayMultiplier;

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
      const visitsByClient = completedVisits?.filter(
        (v) => (v as any).scheduled_visits?.client_id === clientId
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
      let totalAmount = 0;
      const items: any[] = [];

      // Process each visit and calculate billing
      for (const visit of visitsByClient) {
        const scheduled = (visit as any).scheduled_visits;
        const billableMinutes = visit.billable_duration_minutes || 0;
        const billableHours = billableMinutes / 60;

        // Resolve billing rules
        const rules = await this.resolveBillingRules({
          organizationId,
          visitId: visit.id,
          clientId,
          employeeId: scheduled.employee_id,
          branchId: scheduled.branch_id,
          visitDate: new Date(scheduled.scheduled_date),
          startTime: new Date(`${scheduled.scheduled_date}T${scheduled.start_time}`),
          endTime: new Date(`${scheduled.scheduled_date}T${scheduled.end_time}`),
          visitType: scheduled.visit_type,
          carePlanId: scheduled.care_plan_id,
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

        totalAmount += itemTotal;

        items.push({
          visitId: visit.id,
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
        });
      }

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
        await this.supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoiceId);
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

      // Insert invoice items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await this.supabase.from("invoice_items").insert({
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
        });
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
    visitExecutionId: string
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

      const scheduled = (execution as any).scheduled_visits;
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

      // Check for existing timesheet
      const { data: existingTimesheet } = await this.supabase
        .from("timesheets")
        .select("id")
        .eq("visit_id", scheduled.id)
        .eq("is_deleted", false)
        .maybeSingle();

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

      if (existingTimesheet) {
        // Update existing
        await this.supabase
          .from("timesheets")
          .update(timesheetData)
          .eq("id", existingTimesheet.id);

        return existingTimesheet.id;
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
          cancelled_at:
            newStatus === "cancelled" ? new Date().toISOString() : undefined,
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
