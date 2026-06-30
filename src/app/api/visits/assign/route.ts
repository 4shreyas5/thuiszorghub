/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const {
      visitId,
      employeeId
    } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get visit details
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", visitId)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check conflicts
    const { data: conflicts } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("scheduled_date", visit.scheduled_date)
      .eq("is_deleted", false);

    const hasConflict = conflicts?.some((v: any) => {
      const visitStart = new Date(`2000-01-01T${v.start_time}`);
      const visitEnd = new Date(`2000-01-01T${v.end_time}`);
      const newStart = new Date(`2000-01-01T${visit.start_time}`);
      const newEnd = new Date(`2000-01-01T${visit.end_time}`);

      return !(newEnd <= visitStart || newStart >= visitEnd);
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "Employee has conflicting visit" },
        { status: 409 }
      );
    }

    // Assign employee
    const { error } = await (supabase.from("scheduled_visits") as any)
      .update({
        employee_id: employeeId,
        status: "assigned",
        updated_at: new Date().toISOString()
      })
      .eq("id", visitId);

    if (error) throw error;

    // Log assignment
    await (supabase.from("audit_logs") as any).insert({
      organization_id: visit.organization_id,
      user_id: user.id,
      event_type: "UPDATE",
      resource_type: "scheduled_visits",
      resource_id: visitId,
      action: "assigned",
      changes: { employee_id: employeeId }
    });

    return NextResponse.json({ success: true, visitId, employeeId });
  } catch (error) {
    console.error("Error assigning visit:", error);
    return NextResponse.json({ error: "Failed to assign visit" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const visitId = searchParams.get("visitId");
    const branchId = searchParams.get("branchId");

    if (!visitId || !branchId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get visit details
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", visitId)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get all active employees in branch
    const { data: employees } = await (supabase.from("employees") as any)
      .select("*")
      .eq("branch_id", branchId)
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (!employees) {
      return NextResponse.json({ suggestions: [] });
    }

    // Score employees based on criteria
    const suggestions = await Promise.all(
      employees.map(async (employee: any) => {
        const score = {
          employee,
          score: 50,
          reasons: [] as string[]
        };

        // Check if employee is available
        const dayOfWeek = new Date(visit.scheduled_date).getDay();
        const { data: availability } = await (supabase.from("employee_availability") as any)
          .select("*")
          .eq("employee_id", employee.id)
          .eq("day_of_week", dayOfWeek)
          .single();

        if (!availability || !availability.is_available) {
          return null;
        }

        const workStart = new Date(`2000-01-01T${availability.start_time}`);
        const workEnd = new Date(`2000-01-01T${availability.end_time}`);
        const visitStart = new Date(`2000-01-01T${visit.start_time}`);
        const visitEnd = new Date(`2000-01-01T${visit.end_time}`);

        if (visitStart < workStart || visitEnd > workEnd) {
          return null;
        }

        score.reasons.push("Available during working hours");
        score.score += 20;

        // Check for conflicts
        const { data: conflicts } = await (supabase.from("scheduled_visits") as any)
          .select("*")
          .eq("employee_id", employee.id)
          .eq("scheduled_date", visit.scheduled_date)
          .eq("is_deleted", false);

        const hasConflict = conflicts?.some((v: any) => {
          const existingStart = new Date(`2000-01-01T${v.start_time}`);
          const existingEnd = new Date(`2000-01-01T${v.end_time}`);

          return !(visitEnd <= existingStart || visitStart >= existingEnd);
        });

        if (hasConflict) {
          return null;
        }

        score.reasons.push("No scheduling conflicts");
        score.score += 10;

        // Check if assigned to client via care plan
        const { data: assignment } = await (supabase.from("employee_client_assignments") as any)
          .select("*")
          .eq("employee_id", employee.id)
          .eq("client_id", visit.client_id)
          .single();

        if (assignment) {
          score.reasons.push("Already assigned to this client");
          score.score += 30;
        }

        return score;
      })
    );

    return NextResponse.json({
      suggestions: suggestions
        .filter((s) => s !== null)
        .sort((a, b) => (b?.score || 0) - (a?.score || 0))
        .slice(0, 5)
    });
  } catch (error) {
    console.error("Error getting assignment suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}

