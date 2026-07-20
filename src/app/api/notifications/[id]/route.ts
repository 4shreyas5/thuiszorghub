import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const body = await request.json();
    const { isRead, isArchived } = body;

    const updateData: Record<string, unknown> = {};

    if (isRead !== undefined) {
      updateData.is_read = isRead;
      if (isRead) {
        updateData.read_at = new Date().toISOString();
      }
    }

    if (isArchived !== undefined) {
      updateData.is_archived = isArchived;
      if (isArchived) {
        updateData.archived_at = new Date().toISOString();
      }
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", context.userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: notification });
  } catch (error) {
    console.error("Error updating notification:", error);
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

    // Soft delete
    const { error } = await supabase
      .from("notifications")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", context.userId);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
