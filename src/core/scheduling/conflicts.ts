/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ConflictCheckParams {
  employeeId: string;
  clientId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  excludeVisitId?: string;
}

export interface VisitConflict {
  type:
    | "INACTIVE_EMPLOYEE"
    | "DOUBLE_BOOKING"
    | "EMPLOYEE_UNAVAILABLE"
    | "OUTSIDE_WORKING_HOURS"
    | "INACTIVE_CLIENT";
  message: string;
  conflictingVisitId?: string;
  unavailabilityId?: string;
}

/**
 * The single source of truth for visit-scheduling conflicts, used by the
 * standalone /api/visits/conflicts endpoint AND by POST/PUT /api/visits and
 * POST /api/visits/assign - previously each of those three routes carried
 * its own inline copy of only the double-booking check, while this richer
 * logic (unavailability, working hours, inactive client) sat unused in the
 * conflicts route. Consolidated here so there's exactly one implementation.
 */
export async function checkVisitConflicts(
  supabase: any,
  { employeeId, clientId, scheduledDate, startTime, endTime, excludeVisitId }: ConflictCheckParams
): Promise<VisitConflict[]> {
  const conflicts: VisitConflict[] = [];

  const dayOfWeek = new Date(scheduledDate).getDay();

  // The 5 lookups below are independent of one another - none of their
  // filters depend on another query's result, they only depend on this
  // function's input params - so they're fetched concurrently instead of
  // as 5 sequential round trips. Downstream logic (including the
  // INACTIVE_EMPLOYEE early return) is unchanged and evaluated after all
  // of them have resolved.
  const [
    { data: employee },
    { data: existingVisits },
    { data: unavailability },
    { data: availability },
    { data: client },
  ] = await Promise.all([
    supabase.from("employees").select("id, is_active").eq("id", employeeId).single(),
    supabase
      .from("scheduled_visits")
      .select("id, title, start_time, end_time")
      .eq("employee_id", employeeId)
      .eq("scheduled_date", scheduledDate)
      .eq("is_deleted", false),
    supabase
      .from("employee_unavailability")
      .select("id, unavailability_type")
      .eq("employee_id", employeeId)
      .eq("is_deleted", false)
      .lte("start_date", scheduledDate)
      .gte("end_date", scheduledDate),
    supabase
      .from("employee_availability")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("day_of_week", dayOfWeek)
      .single(),
    clientId
      ? supabase.from("clients").select("id, is_active").eq("id", clientId).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!employee || !employee.is_active) {
    return [{ type: "INACTIVE_EMPLOYEE", message: "Employee is not active" }];
  }

  (existingVisits || []).forEach((visit: any) => {
    if (excludeVisitId && visit.id === excludeVisitId) return;

    const visitStart = new Date(`2000-01-01T${visit.start_time}`);
    const visitEnd = new Date(`2000-01-01T${visit.end_time}`);
    const newStart = new Date(`2000-01-01T${startTime}`);
    const newEnd = new Date(`2000-01-01T${endTime}`);

    if (!(newEnd <= visitStart || newStart >= visitEnd)) {
      conflicts.push({
        type: "DOUBLE_BOOKING",
        message: `Overlaps with ${visit.title}`,
        conflictingVisitId: visit.id,
      });
    }
  });

  if (unavailability && unavailability.length > 0) {
    conflicts.push({
      type: "EMPLOYEE_UNAVAILABLE",
      message: `Employee has ${unavailability[0].unavailability_type.toLowerCase()} scheduled`,
      unavailabilityId: unavailability[0].id,
    });
  }

  if (availability && !availability.is_available) {
    conflicts.push({
      type: "OUTSIDE_WORKING_HOURS",
      message: "Employee is not available on this day",
    });
  } else if (availability) {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const workStart = new Date(`2000-01-01T${availability.start_time}`);
    const workEnd = new Date(`2000-01-01T${availability.end_time}`);

    if (start < workStart || end > workEnd) {
      conflicts.push({
        type: "OUTSIDE_WORKING_HOURS",
        message: `Visit is outside working hours (${availability.start_time} - ${availability.end_time})`,
      });
    }
  }

  if (clientId && client && !client.is_active) {
    conflicts.push({ type: "INACTIVE_CLIENT", message: "Client is not active" });
  }

  return conflicts;
}
