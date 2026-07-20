import { NextRequest, NextResponse } from "next/server";
import { TimesheetFilterSchema } from "@/core/validation/billing-schemas";
import { ZodError } from "zod";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.view");
    if (permError) return permError;

    const searchParams = request.nextUrl.searchParams;
    const filterData = {
      employeeId: searchParams.get("employeeId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      isBilled: searchParams.get("isBilled") ? searchParams.get("isBilled") === "true" : undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validatedFilters = TimesheetFilterSchema.parse(filterData);

    let query = supabase
      .from("timesheets")
      .select(
        `
        *,
        employee:employees(id, first_name, last_name),
        client:clients(id, first_name, last_name),
        visit:scheduled_visits(id, title, visit_type)
      `,
        { count: "exact" }
      )
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .order("visit_date", { ascending: false })
      .range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1);

    if (validatedFilters.employeeId) {
      query = query.eq("employee_id", validatedFilters.employeeId);
    }

    if (validatedFilters.clientId) {
      query = query.eq("client_id", validatedFilters.clientId);
    }

    if (validatedFilters.startDate) {
      query = query.gte("visit_date", validatedFilters.startDate.toISOString().split("T")[0]);
    }

    if (validatedFilters.endDate) {
      query = query.lte("visit_date", validatedFilters.endDate.toISOString().split("T")[0]);
    }

    if (validatedFilters.isBilled !== undefined) {
      query = query.eq("is_billed", validatedFilters.isBilled);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        limit: validatedFilters.limit,
        offset: validatedFilters.offset,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
