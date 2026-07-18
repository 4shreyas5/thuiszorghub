/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { createCarePlanSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

    if (!userData || !userData.organization_id) {
      return NextResponse.json(
        { error: "User not found or not assigned to organization" },
        { status: 404 }
      );
    }

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
      .eq("organization_id", userData.organization_id)
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
    const supabase = await createServerClient();
    const body = await request.json();

    const validated = createCarePlanSchema.parse(body);

    const { data: userData } = await (supabase.auth.getUser() as any);
    const userId = userData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { data: client } = await (supabase.from("clients") as any)
      .select("id, is_deleted")
      .eq("id", validated.client_id)
      .eq("is_deleted", false)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found or inactive" }, { status: 400 });
    }

    const careplanData = {
      ...validated,
      organization_id: user.organization_id,
      created_by_id: userId,
      primary_caregiver_id: validated.primary_caregiver_id || null,
    };

    const { data, error } = await (supabase.from("care_plans") as any)
      .insert([careplanData])
      .select();

    if (error) throw error;

    // audit_logs' real columns are event_type/resource_type/resource_id
    // (see migration 001) - entity_type/performed_by_id don't exist on
    // this table. Matches the convention already fixed for clients.
    await (supabase.from("audit_logs") as any).insert([
      {
        organization_id: user.organization_id,
        user_id: userId,
        event_type: "CREATE",
        resource_type: "care_plans",
        resource_id: data[0]?.id,
        action: "created",
        changes: { new_values: careplanData },
      },
    ]);

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating care plan:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create care plan" }, { status: 500 });
  }
}
