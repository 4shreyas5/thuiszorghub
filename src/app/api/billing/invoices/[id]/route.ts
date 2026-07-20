import { NextRequest, NextResponse } from "next/server";
import { UpdateInvoiceStatusSchema } from "@/core/validation/billing-schemas";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.view");
    if (permError) return permError;

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        `
        *,
        items:invoice_items(*),
        payments:payments(*),
        client:clients(id, first_name, last_name, email, phone),
        branch:branches(id, name),
        statusHistory:invoice_status_history(*)
      `
      )
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.manage");
    if (permError) return permError;

    const body = await request.json();
    const validatedData = UpdateInvoiceStatusSchema.parse(body);

    // Fetch current invoice
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (!currentInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update invoice
    const { data: updatedInvoice } = await supabase
      .from("invoices")
      .update({
        status: validatedData.status,
        updated_by: context.userId,
        updated_at: new Date(),
        sent_at: validatedData.status === "sent" ? new Date() : currentInvoice.sent_at,
        paid_at: validatedData.status === "paid" ? new Date() : currentInvoice.paid_at,
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    // Log status change
    if (validatedData.status !== currentInvoice.status) {
      await supabase.from("invoice_status_history").insert({
        organization_id: context.organizationId,
        invoice_id: id,
        old_status: currentInvoice.status,
        new_status: validatedData.status,
        changed_reason: validatedData.changedReason,
        notes: validatedData.notes,
        created_by: context.userId,
      });
    }

    await writeAuditLog(context, {
      eventType: "UPDATE",
      resourceType: "invoices",
      resourceId: id,
      action: "updated",
      changes: {
        status: {
          old: currentInvoice.status,
          new: validatedData.status,
        },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.manage");
    if (permError) return permError;

    // Soft delete
    const { data } = await supabase
      .from("invoices")
      .update({
        is_deleted: true,
        deleted_at: new Date(),
        updated_by: context.userId,
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (!data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await writeAuditLog(context, {
      eventType: "DELETE",
      resourceType: "invoices",
      resourceId: id,
      action: "deleted",
      changes: { old_values: data },
    });

    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
