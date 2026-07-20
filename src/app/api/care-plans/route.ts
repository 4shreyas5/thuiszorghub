/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createCarePlanSchema } from "@/core/validation/care-plan";
import { z } from "zod";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

export const dynamic = "force-dynamic";

// No permission gate on GET beyond org membership - list/detail views feed
// pickers and dashboards used by most roles, matching Employees/Clients.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const clientId = searchParams.get("client_id");
    const branchId = searchParams.get("branch_id");
    const employeeId = searchParams.get("employeeId");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("care_plans")
      .select(
        "*, client:client_id(id, first_name, last_name), primary_caregiver:primary_caregiver_id(id, first_name, last_name)",
        { count: "exact" }
      )
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (priority) query = query.eq("priority", priority);
    if (clientId) query = query.eq("client_id", clientId);
    if (branchId) query = query.eq("branch_id", branchId);
    if (employeeId) query = query.eq("primary_caregiver_id", employeeId);
    if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (status !== "all") {
      // Default view excludes archived plans, matching Employees/Clients.
      query = query.neq("status", "archived");
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      care_plans: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching care plans:", error);
    return NextResponse.json({ error: "Failed to fetch care plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "care_plan.create");
    if (permError) return permError;

    const body = await request.json();

    const validated = createCarePlanSchema.parse(body);

    const { data: client } = await (context.supabase.from("clients") as any)
      .select("id, is_deleted")
      .eq("id", validated.client_id)
      .eq("is_deleted", false)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found or inactive" }, { status: 400 });
    }

    const careplanData = {
      ...validated,
      organization_id: context.organizationId,
      created_by_id: context.userId,
      primary_caregiver_id: validated.primary_caregiver_id || null,
    };

    const { data, error } = await (context.supabase.from("care_plans") as any)
      .insert([careplanData])
      .select();

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "care_plans",
      resourceId: data[0]?.id,
      action: "created",
      changes: { new_values: careplanData },
    });

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating care plan:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create care plan" }, { status: 500 });
  }
}
