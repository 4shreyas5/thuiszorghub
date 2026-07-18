import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { CreatePaymentSchema, PaymentFilterSchema } from "@/core/validation/billing-schemas";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filterData = {
      invoiceId: searchParams.get("invoiceId") || undefined,
      status: searchParams.get("status") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validatedFilters = PaymentFilterSchema.parse(filterData);

    let query = supabase
      .from("payments")
      .select("*,invoice:invoices(invoice_number,client:clients(first_name,last_name))", {
        count: "exact",
      })
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .order("payment_date", { ascending: false })
      .range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1);

    if (validatedFilters.invoiceId) {
      query = query.eq("invoice_id", validatedFilters.invoiceId);
    }

    if (validatedFilters.status) {
      query = query.eq("status", validatedFilters.status);
    }

    if (validatedFilters.paymentMethod) {
      query = query.eq("payment_method", validatedFilters.paymentMethod);
    }

    if (validatedFilters.startDate) {
      query = query.gte("payment_date", validatedFilters.startDate);
    }

    if (validatedFilters.endDate) {
      query = query.lte("payment_date", validatedFilters.endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        limit: validatedFilters.limit,
        offset: validatedFilters.offset,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = CreatePaymentSchema.parse(body);

    // Get invoice to update balance
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", validatedData.invoiceId)
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        organization_id: userData.organization_id,
        invoice_id: validatedData.invoiceId,
        payment_date: validatedData.paymentDate,
        amount: validatedData.amount,
        payment_method: validatedData.paymentMethod,
        reference_number: validatedData.referenceNumber,
        bank_account: validatedData.bankAccount,
        transaction_id: validatedData.transactionId,
        status: "completed",
        notes: validatedData.notes,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to create payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // Update invoice balance
    const newPaidAmount = invoice.paid_amount + validatedData.amount;
    const newRemainingBalance = Math.max(0, invoice.total_amount - newPaidAmount);
    const newStatus =
      newRemainingBalance === 0 ? "paid" : newPaidAmount > 0 ? "partially_paid" : invoice.status;

    await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        remaining_balance: newRemainingBalance,
        status: newStatus,
        paid_at: newRemainingBalance === 0 ? new Date() : invoice.paid_at,
        updated_by: user.id,
      })
      .eq("id", validatedData.invoiceId);

    // Audit log
    await supabase.from("audit_logs").insert({
      organization_id: userData.organization_id,
      user_id: user.id,
      event_type: "CREATE",
      resource_type: "payments",
      resource_id: payment.id,
      action: "created",
      changes: { new_values: payment },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
