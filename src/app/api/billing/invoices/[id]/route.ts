import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { UpdateInvoiceStatusSchema } from "@/core/validation/billing-schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: invoice } = await supabase
      .from("invoices")
      .select(`
        *,
        items:invoice_items(*),
        payments:payments(*),
        client:clients(id, name, email, phone),
        branch:branches(id, name),
        statusHistory:invoice_status_history(*)
      `)
      .eq("id", id)
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validatedData = UpdateInvoiceStatusSchema.parse(body);

    // Fetch current invoice
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("organization_id", userData.organization_id)
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
        updated_by: user.id,
        updated_at: new Date(),
        sent_at: validatedData.status === "sent" ? new Date() : currentInvoice.sent_at,
        paid_at: validatedData.status === "paid" ? new Date() : currentInvoice.paid_at,
      })
      .eq("id", id)
      .select()
      .single();

    // Log status change
    if (validatedData.status !== currentInvoice.status) {
      await supabase.from("invoice_status_history").insert({
        organization_id: userData.organization_id,
        invoice_id: id,
        old_status: currentInvoice.status,
        new_status: validatedData.status,
        changed_reason: validatedData.changedReason,
        notes: validatedData.notes,
        created_by: user.id,
      });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      organization_id: userData.organization_id,
      user_id: user.id,
      resource_type: "invoices",
      resource_id: id,
      action: "update",
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
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Soft delete
    const { data } = await supabase
      .from("invoices")
      .update({
        is_deleted: true,
        deleted_at: new Date(),
        updated_by: user.id,
      })
      .eq("id", id)
      .eq("organization_id", userData.organization_id)
      .select()
      .single();

    if (!data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      organization_id: userData.organization_id,
      user_id: user.id,
      resource_type: "invoices",
      resource_id: id,
      action: "delete",
      changes: data,
    });

    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
