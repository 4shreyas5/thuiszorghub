/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { checkVisitConflicts } from "@/core/scheduling/conflicts";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "schedule.assign");
    if (permError) return permError;

    const body = await request.json();
    const { visitId, employeeId } = body;

    // Get visit details - scoped to the caller's own org.
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", visitId)
      .eq("organization_id", context.organizationId)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check conflicts - shared helper, see src/core/scheduling/conflicts.ts
    const conflicts = await checkVisitConflicts(supabase, {
      employeeId,
      clientId: visit.client_id,
      scheduledDate: visit.scheduled_date,
      startTime: visit.start_time,
      endTime: visit.end_time,
      excludeVisitId: visitId,
    });

    if (conflicts.some((c) => c.type === "DOUBLE_BOOKING")) {
      return NextResponse.json({ error: "Employee has conflicting visit" }, { status: 409 });
    }

    // Assign employee
    const { error } = await (supabase.from("scheduled_visits") as any)
      .update({
        employee_id: employeeId,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", visitId)
      .eq("organization_id", context.organizationId);

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "UPDATE",
      resourceType: "scheduled_visits",
      resourceId: visitId,
      action: "assigned",
      changes: { employee_id: employeeId },
    });

    return NextResponse.json({ success: true, visitId, employeeId });
  } catch (error) {
    console.error("Error assigning visit:", error);
    return NextResponse.json({ error: "Failed to assign visit" }, { status: 500 });
  }
}

// No permission gate beyond org membership - read-only scoring, feeds the
// "suggest an employee" picker in the scheduling UI.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const searchParams = request.nextUrl.searchParams;
    const visitId = searchParams.get("visitId");
    const branchId = searchParams.get("branchId");

    if (!visitId || !branchId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get visit details - scoped to the caller's own org.
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", visitId)
      .eq("organization_id", context.organizationId)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get all active employees in branch
    const { data: employees } = await (supabase.from("employees") as any)
      .select("*")
      .eq("branch_id", branchId)
      .eq("organization_id", context.organizationId)
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (!employees) {
      return NextResponse.json({ suggestions: [] });
    }

    // Batch-fetch the per-employee lookups ONCE for all candidate employees
    // instead of issuing 3 queries per employee inside the map below (which
    // was 3xN round trips for N branch employees). Same filters as before,
    // just widened from .eq("employee_id", employee.id) to
    // .in("employee_id", employeeIds), then grouped in memory.
    const employeeIds = employees.map((employee: any) => employee.id);
    const dayOfWeek = new Date(visit.scheduled_date).getDay();

    const [{ data: availabilityRows }, { data: conflictRows }, { data: assignmentRows }] =
      await Promise.all([
        (supabase.from("employee_availability") as any)
          .select("*")
          .in("employee_id", employeeIds)
          .eq("day_of_week", dayOfWeek),
        (supabase.from("scheduled_visits") as any)
          .select("*")
          .in("employee_id", employeeIds)
          .eq("scheduled_date", visit.scheduled_date)
          .eq("is_deleted", false),
        (supabase.from("employee_client_assignments") as any)
          .select("*")
          .in("employee_id", employeeIds)
          .eq("client_id", visit.client_id),
      ]);

    const availabilityByEmployee = new Map<string, any>();
    (availabilityRows || []).forEach((row: any) => {
      availabilityByEmployee.set(row.employee_id, row);
    });

    const conflictsByEmployee = new Map<string, any[]>();
    (conflictRows || []).forEach((row: any) => {
      const list = conflictsByEmployee.get(row.employee_id) || [];
      list.push(row);
      conflictsByEmployee.set(row.employee_id, list);
    });

    const assignmentByEmployee = new Map<string, any>();
    (assignmentRows || []).forEach((row: any) => {
      if (!assignmentByEmployee.has(row.employee_id)) {
        assignmentByEmployee.set(row.employee_id, row);
      }
    });

    // Score employees based on criteria
    const suggestions = employees.map((employee: any) => {
      const score = {
        employee,
        score: 50,
        reasons: [] as string[],
      };

      // Check if employee is available
      const availability = availabilityByEmployee.get(employee.id);

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
      const conflicts = conflictsByEmployee.get(employee.id);

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
      const assignment = assignmentByEmployee.get(employee.id);

      if (assignment) {
        score.reasons.push("Already assigned to this client");
        score.score += 30;
      }

      return score;
    });

    return NextResponse.json({
      suggestions: suggestions
        .filter((s: any) => s !== null)
        .sort((a: any, b: any) => (b?.score || 0) - (a?.score || 0))
        .slice(0, 5),
    });
  } catch (error) {
    console.error("Error getting assignment suggestions:", error);
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}
