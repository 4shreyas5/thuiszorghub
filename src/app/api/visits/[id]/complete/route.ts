/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!["completed", "no_show", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be completed, no_show, or cancelled" },
        { status: 400 }
      );
    }

    // Get existing visit
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Update visit status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data: visit, error } = await (supabase.from("scheduled_visits") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: existingVisit.organization_id,
      user_id: user.id,
      event_type: "UPDATE",
      resource_type: "scheduled_visits",
      resource_id: id,
      action: `marked_as_${status}`,
      changes: { previous_status: existingVisit.status, new_status: status }
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: existingVisit.organization_id,
      scheduled_visit_id: id,
      action: `marked_as_${status}`,
      action_by_id: user.id,
      new_values: { status, notes }
    });

    // Auto-generate notification on visit completion
    if (status === "completed") {
      try {
        // Get client and employee info
        const { data: assignment } = await (supabase.from("employee_client_assignments") as any)
          .select("client_id")
          .eq("id", existingVisit.assignment_id)
          .single();

        if (assignment?.client_id) {
          // Get client user_id
          const { data: clientUser } = await (supabase.from("users") as any)
            .select("id")
            .eq("employee_id", assignment.client_id)
            .single();

          if (clientUser?.id) {
            await (supabase.from("notifications") as any).insert({
              organization_id: existingVisit.organization_id,
              user_id: clientUser.id,
              notification_type: "visit_completed",
              title: "Visit Completed",
              message: `Your visit on ${new Date(existingVisit.scheduled_date).toLocaleDateString()} has been completed.`,
              action_url: `/admin/visits/${id}`,
              entity_type: "scheduled_visits",
              entity_id: id,
              metadata: { status, notes }
            });
          }
        }
      } catch (notificationError) {
        console.error("Error creating visit completion notification:", notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error completing visit:", error);
    return NextResponse.json({ error: "Failed to complete visit" }, { status: 500 });
  }
}
