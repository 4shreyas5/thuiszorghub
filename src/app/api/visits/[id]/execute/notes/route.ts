/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { saveVisitNoteSchema } from "@/core/validation/visit-execution";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: notes } = await (supabase.from("visit_notes") as any)
      .select("*")
      .eq("scheduled_visit_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error("Error fetching visit notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

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
    const validatedData = saveVisitNoteSchema.parse(body);

    // Get visit
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get visit execution
    const { data: execution } = await (supabase.from("visit_executions") as any)
      .select("id")
      .eq("scheduled_visit_id", id)
      .in("status", ["started", "in_progress"])
      .eq("is_deleted", false)
      .single();

    if (!execution) {
      return NextResponse.json({ error: "Visit not in progress" }, { status: 400 });
    }

    // Save note
    const { data: note, error: noteError } = await (supabase.from("visit_notes") as any)
      .insert({
        visit_execution_id: execution.id,
        scheduled_visit_id: id,
        category: validatedData.category,
        content: validatedData.content,
        mood_score: validatedData.mood_score || null,
        pain_score: validatedData.pain_score || null,
        vital_signs: validatedData.vital_signs || null,
        recommendations: validatedData.recommendations || null,
        created_by_id: user.id,
      })
      .select()
      .single();

    if (noteError) throw noteError;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: visit.organization_id,
      user_id: user.id,
      event_type: "CREATE",
      resource_type: "visit_notes",
      resource_id: note.id,
      action: "note_saved",
      changes: { category: validatedData.category }
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error saving visit note:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
