/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { createTaskSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data, error } = await (supabase.from("care_plan_tasks") as any)
      .select("*, assigned_employee:assigned_to_employee_id(id, first_name, last_name)")
      .eq("care_plan_id", id)
      .eq("is_deleted", false)
      .order("time_category", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const body = await request.json();

    const validated = createTaskSchema.parse({ ...body, care_plan_id: id });

    const { data: carePlan } = await (supabase.from("care_plans") as any)
      .select("id, is_deleted")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    if (validated.assigned_to_employee_id) {
      const { data: employee } = await (supabase.from("employees") as any)
        .select("id, is_active")
        .eq("id", validated.assigned_to_employee_id)
        .single();

      if (!employee || !employee.is_active) {
        return NextResponse.json({ error: "Employee not found or inactive" }, { status: 400 });
      }
    }

    const { data, error } = await (supabase.from("care_plan_tasks") as any)
      .insert([validated])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
