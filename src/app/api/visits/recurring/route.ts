/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { addDays, addWeeks, addMonths } from "date-fns";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

function generateRecurringDates(
  startDate: Date,
  pattern: string,
  _customRrule: string | null,
  endDate: Date | null,
  occurrenceCount: number | null,
  skipDates: string[]
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  let count = 0;
  const maxOccurrences = occurrenceCount || 365;

  const isSkipped = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return skipDates.includes(dateStr);
  };

  while (dates.length < maxOccurrences) {
    if (endDate && currentDate > endDate) break;
    if (!isSkipped(currentDate)) {
      dates.push(new Date(currentDate));
    }

    switch (pattern) {
      case "daily":
        currentDate = addDays(currentDate, 1);
        break;
      case "weekly":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "bi-weekly":
        currentDate = addWeeks(currentDate, 2);
        break;
      case "monthly":
        currentDate = addMonths(currentDate, 1);
        break;
      default:
        return dates;
    }

    count++;
    if (count > maxOccurrences * 2) break;
  }

  return dates;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "visit.create");
    if (permError) return permError;

    const body = await request.json();
    const {
      clientId,
      employeeId,
      branchId,
      carePlanId,
      title,
      visitType,
      description,
      startDate,
      startTime,
      endTime,
      estimatedDurationMinutes,
      priority = "normal",
      notes,
      pattern,
      _customRrule,
      endDate,
      occurrenceCount,
      skipDates = [],
    } = body;

    // Validate client/employee belong to the caller's own org - the
    // per-visit sibling (POST /api/visits) already does this; this bulk
    // endpoint previously didn't, so a client_id/employee_id from a
    // different organization could be woven into this org's schedule.
    const { data: client } = await (supabase.from("clients") as any)
      .select("id, organization_id")
      .eq("id", clientId)
      .eq("is_deleted", false)
      .single();

    if (!client || client.organization_id !== context.organizationId) {
      return NextResponse.json({ error: "Cross-organization visit not allowed" }, { status: 403 });
    }

    if (employeeId) {
      const { data: employee } = await (supabase.from("employees") as any)
        .select("id, organization_id")
        .eq("id", employeeId)
        .eq("is_deleted", false)
        .single();

      if (!employee || employee.organization_id !== context.organizationId) {
        return NextResponse.json(
          { error: "Cross-organization visit not allowed" },
          { status: 403 }
        );
      }
    }

    // Create recurrence record
    const { data: recurrence } = await (supabase.from("visit_recurrence") as any)
      .insert({
        organization_id: context.organizationId,
        recurrence_pattern: pattern,
        custom_rrule: _customRrule,
        end_date: endDate,
        occurrence_count: occurrenceCount,
        skip_dates: skipDates,
        is_active: true,
      })
      .select()
      .single();

    if (!recurrence) {
      return NextResponse.json({ error: "Failed to create recurrence" }, { status: 500 });
    }

    // Generate dates
    const dates = generateRecurringDates(
      new Date(startDate),
      pattern,
      _customRrule,
      endDate ? new Date(endDate) : null,
      occurrenceCount,
      skipDates
    );

    // Create visits
    const visitsToCreate = dates.map((date) => ({
      organization_id: context.organizationId,
      client_id: clientId,
      employee_id: employeeId,
      branch_id: branchId,
      care_plan_id: carePlanId,
      title,
      visit_type: visitType,
      description,
      scheduled_date: date.toISOString().split("T")[0],
      start_time: startTime,
      end_time: endTime,
      estimated_duration_minutes: estimatedDurationMinutes,
      priority,
      status: "scheduled",
      notes,
      visit_recurrence_id: recurrence.id,
    }));

    const { data: visits, error } = await (supabase.from("scheduled_visits") as any)
      .insert(visitsToCreate)
      .select();

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "visit_recurrence",
      resourceId: recurrence.id,
      action: "created",
      changes: {
        new_values: {
          recurrence,
          visitCount: visits?.length || 0,
        },
      },
    });

    return NextResponse.json(
      {
        recurrence,
        visits,
        generatedCount: visits?.length || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating recurring visits:", error);
    return NextResponse.json({ error: "Failed to create recurring visits" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const active = searchParams.get("active") === "true";

    const offset = (page - 1) * limit;

    let query = (supabase.from("visit_recurrence") as any)
      .select("*")
      .eq("organization_id", context.organizationId);

    if (active === true) {
      query = query.eq("is_active", true);
    }

    const { data: recurrences, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await (supabase.from("visit_recurrence") as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", context.organizationId);

    return NextResponse.json({
      recurrences,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching recurrences:", error);
    return NextResponse.json({ error: "Failed to fetch recurrences" }, { status: 500 });
  }
}
