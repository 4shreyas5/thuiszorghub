/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { addDays, addWeeks, addMonths } from "date-fns";

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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      skipDates = []
    } = body;

    // Get organization
    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create recurrence record
    const { data: recurrence } = await (supabase.from("visit_recurrence") as any)
      .insert({
        organization_id: userData.organization_id,
        recurrence_pattern: pattern,
        custom_rrule: _customRrule,
        end_date: endDate,
        occurrence_count: occurrenceCount,
        skip_dates: skipDates,
        is_active: true
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
      organization_id: userData.organization_id,
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
      visit_recurrence_id: recurrence.id
    }));

    const { data: visits, error } = await (supabase.from("scheduled_visits") as any)
      .insert(visitsToCreate)
      .select();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: user.id,
      event_type: "CREATE",
      resource_type: "visit_recurrence",
      resource_id: recurrence.id,
      action: "created",
      changes: {
        new_values: {
          recurrence,
          visitCount: visits?.length || 0
        }
      }
    });

    return NextResponse.json({
      recurrence,
      visits,
      generatedCount: visits?.length || 0
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring visits:", error);
    return NextResponse.json({ error: "Failed to create recurring visits" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const active = searchParams.get("active") === "true";

    const offset = (page - 1) * limit;

    let query = (supabase.from("visit_recurrence") as any).select("*");

    if (active === true) {
      query = query.eq("is_active", true);
    }

    const { data: recurrences, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await (supabase.from("visit_recurrence") as any)
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      recurrences,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching recurrences:", error);
    return NextResponse.json({ error: "Failed to fetch recurrences" }, { status: 500 });
  }
}

