import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { TimesheetFilterSchema } from "@/core/validation/billing-schemas";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filterData = {
      employeeId: searchParams.get("employeeId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
      isBilled: searchParams.get("isBilled")
        ? searchParams.get("isBilled") === "true"
        : undefined,
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
      .eq("organization_id", userData.organization_id)
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
      query = query.gte(
        "visit_date",
        validatedFilters.startDate.toISOString().split("T")[0]
      );
    }

    if (validatedFilters.endDate) {
      query = query.lte(
        "visit_date",
        validatedFilters.endDate.toISOString().split("T")[0]
      );
    }

    if (validatedFilters.isBilled !== undefined) {
      query = query.eq("is_billed", validatedFilters.isBilled);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch timesheets" },
        { status: 500 }
      );
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
