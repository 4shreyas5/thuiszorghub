import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Log preview action
    await supabase.from("document_audit_logs").insert({
      organization_id: context.organizationId,
      document_id: id,
      user_id: context.userId,
      action: "preview",
    });

    return NextResponse.json({ data: document });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "document.update");
    if (permError) return permError;

    const body = await request.json();
    const { expiryDate, verificationStatus, verificationNotes } = body;

    const { data: document, error } = await supabase
      .from("documents")
      .update({
        expiry_date: expiryDate,
        verification_status: verificationStatus,
        verification_notes: verificationNotes,
        verified_by: verificationStatus !== "unverified" ? context.userId : null,
        verified_at: verificationStatus !== "unverified" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: document });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "document.delete");
    if (permError) return permError;

    const { data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Soft delete
    await supabase
      .from("documents")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    // Log the action
    await supabase.from("document_audit_logs").insert({
      organization_id: context.organizationId,
      document_id: id,
      user_id: context.userId,
      action: "delete",
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
