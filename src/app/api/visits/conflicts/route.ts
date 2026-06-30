/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const {
      employeeId,
      scheduledDate,
      startTime,
      endTime,
      excludeVisitId
    } = body;

    // Get employee
    const { data: employee } = await (supabase.from("employees") as any)
      .select("*")
      .eq("id", employeeId)
      .single();

    if (!employee || !employee.is_active) {
      return NextResponse.json({
        conflicts: [{ type: "INACTIVE_EMPLOYEE", message: "Employee is not active" }]
      });
    }

    const conflicts: any[] = [];

    // Check for double booking
    const { data: existingVisits } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("scheduled_date", scheduledDate)
      .eq("is_deleted", false);

    existingVisits?.forEach((visit: any) => {
      if (excludeVisitId && visit.id === excludeVisitId) return;

      const visitStart = new Date(`2000-01-01T${visit.start_time}`);
      const visitEnd = new Date(`2000-01-01T${visit.end_time}`);
      const newStart = new Date(`2000-01-01T${startTime}`);
      const newEnd = new Date(`2000-01-01T${endTime}`);

      if (!(newEnd <= visitStart || newStart >= visitEnd)) {
        conflicts.push({
          type: "DOUBLE_BOOKING",
          message: `Overlaps with ${visit.title}`,
          conflictingVisitId: visit.id
        });
      }
    });

    // Check for unavailability
    const { data: unavailability } = await (supabase.from("employee_unavailability") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("is_deleted", false)
      .lte("start_date", scheduledDate)
      .gte("end_date", scheduledDate);

    if (unavailability && unavailability.length > 0) {
      const reason = unavailability[0].unavailability_type;
      conflicts.push({
        type: "EMPLOYEE_UNAVAILABLE",
        message: `Employee has ${reason.toLowerCase()} scheduled`,
        unavailabilityId: unavailability[0].id
      });
    }

    // Check working hours
    const dayOfWeek = new Date(scheduledDate).getDay();
    const { data: availability } = await (supabase.from("employee_availability") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (availability && !availability.is_available) {
      conflicts.push({
        type: "OUTSIDE_WORKING_HOURS",
        message: "Employee is not available on this day"
      });
    } else if (availability) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const workStart = new Date(`2000-01-01T${availability.start_time}`);
      const workEnd = new Date(`2000-01-01T${availability.end_time}`);

      if (start < workStart || end > workEnd) {
        conflicts.push({
          type: "OUTSIDE_WORKING_HOURS",
          message: `Visit is outside working hours (${availability.start_time} - ${availability.end_time})`
        });
      }
    }

    // Check client is active
    const { data: client } = await (supabase.from("clients") as any)
      .select("*")
      .eq("id", body.clientId)
      .single();

    if (client && !client.is_active) {
      conflicts.push({
        type: "INACTIVE_CLIENT",
        message: "Client is not active"
      });
    }

    return NextResponse.json({ conflicts, hasConflicts: conflicts.length > 0 });
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return NextResponse.json({ error: "Failed to check conflicts" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const resolved = searchParams.get("resolved") === "true";

    const offset = (page - 1) * limit;

    let query = (supabase.from("visit_conflicts") as any)
      .select(
        `*,
        visit:scheduled_visits(id, title, scheduled_date),
        employee:employees(id, first_name, last_name),
        conflictingVisit:visit_conflicts_conflicting_visit_id_fkey(id, title, scheduled_date)`
      );

    if (resolved === true || resolved === false) {
      query = query.eq("is_resolved", resolved);
    }

    const { data: conflicts, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await (supabase.from("visit_conflicts") as any)
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      conflicts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching conflicts:", error);
    return NextResponse.json({ error: "Failed to fetch conflicts" }, { status: 500 });
  }
}

