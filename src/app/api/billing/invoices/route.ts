import { NextRequest, NextResponse } from "next/server";
import { CreateInvoiceSchema, InvoiceFilterSchema } from "@/core/validation/billing-schemas";
import { ZodError } from "zod";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.view");
    if (permError) return permError;

    const organizationId = context.organizationId;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterData = {
      status: searchParams.get("status") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      search: searchParams.get("search") || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Validate filter parameters
    const validatedFilters = InvoiceFilterSchema.parse(filterData);

    // Build query
    let query = supabase
      .from("invoices")
      .select("*,client:clients(id,first_name,last_name,email),branch:branches(name)", {
        count: "exact",
      })
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1);

    // Apply filters
    if (validatedFilters.status) {
      query = query.eq("status", validatedFilters.status);
    }

    if (validatedFilters.clientId) {
      query = query.eq("client_id", validatedFilters.clientId);
    }

    if (validatedFilters.branchId) {
      query = query.eq("branch_id", validatedFilters.branchId);
    }

    if (validatedFilters.startDate) {
      query = query.gte("invoice_date", validatedFilters.startDate);
    }

    if (validatedFilters.endDate) {
      query = query.lte("invoice_date", validatedFilters.endDate);
    }

    if (validatedFilters.search) {
      query = query.ilike("invoice_number", `%${validatedFilters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
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
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.manage");
    if (permError) return permError;

    const organizationId = context.organizationId;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = CreateInvoiceSchema.parse(body);

    // Check permission - select both the existence-check column and the
    // notification-sending fields in one query, reused below instead of
    // being re-fetched a second time after the invoice is created.
    const { data: client } = await supabase
      .from("clients")
      .select("id, user_id, is_deleted")
      .eq("id", validatedData.clientId)
      .eq("organization_id", organizationId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of validatedData.items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const vatPercentage = validatedData.items[0]?.vatPercentage || 21;
    const vatAmount = subtotal * (vatPercentage / 100);
    const totalAmount = subtotal + vatAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        organization_id: organizationId,
        branch_id: validatedData.branchId,
        client_id: validatedData.clientId,
        invoice_number: invoiceNumber,
        invoice_date: validatedData.invoiceDate || new Date(),
        due_date: validatedData.dueDate,
        period_start: validatedData.periodStart,
        period_end: validatedData.periodEnd,
        subtotal,
        vat_amount: vatAmount,
        vat_percentage: vatPercentage,
        total_amount: totalAmount,
        remaining_balance: totalAmount,
        status: "draft",
        billing_profile_id: validatedData.billingProfileId,
        template_id: validatedData.templateId,
        notes: validatedData.notes,
        created_by: context.userId,
        updated_by: context.userId,
        currency: "EUR",
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Failed to create invoice:", invoiceError);
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }

    // Create invoice items in a single batched insert instead of one round
    // trip per item.
    const { error: itemsError } = await supabase.from("invoice_items").insert(
      validatedData.items.map((item, i) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemVat = itemSubtotal * ((item.vatPercentage || vatPercentage) / 100);
        const itemTotal = itemSubtotal + itemVat;

        return {
          organization_id: organizationId,
          invoice_id: invoice.id,
          visit_id: item.visitId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          rate_type: item.rateType,
          vat_percentage: item.vatPercentage || vatPercentage,
          subtotal: itemSubtotal,
          vat_amount: itemVat,
          total_amount: itemTotal,
          line_number: i + 1,
          created_by: context.userId,
        };
      })
    );

    if (itemsError) {
      console.error("Failed to create invoice items:", itemsError);
      // Without this, the invoice header would be left behind with a real
      // total_amount/remaining_balance but zero line items - a real
      // customer could be shown (or sent a PDF of) an invoice with a
      // balance owed and no itemization to explain it, with nothing in the
      // API response signaling anything went wrong. Roll back the header
      // so the operation is all-or-nothing instead.
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return NextResponse.json(
        { error: "Failed to create invoice line items - invoice was not created" },
        { status: 500 }
      );
    }

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "invoices",
      resourceId: invoice.id,
      action: "created",
      changes: { new_values: invoice },
    });

    // Auto-generate notification for invoice creation - reuses the client
    // row already fetched above instead of re-querying it.
    try {
      if (!client.is_deleted && client.user_id) {
        await supabase.from("notifications").insert({
          organization_id: organizationId,
          user_id: client.user_id,
          notification_type: "invoice_generated",
          title: "Invoice Generated",
          message: `Invoice #${invoice.invoice_number} has been created for €${invoice.total_amount.toFixed(2)}.`,
          action_url: `/admin/billing/invoices/${invoice.id}`,
          entity_type: "invoices",
          entity_id: invoice.id,
          metadata: { amount: invoice.total_amount, status: invoice.status },
        });
      }
    } catch (notificationError) {
      console.error("Error creating invoice notification:", notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(invoice, { status: 201 });
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
