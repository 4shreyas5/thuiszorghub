/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: employee, error } = await (supabase.from("employees") as any)
      .select(
        `*,
        qualifications:employee_qualifications(*),
        languages:employee_languages(*),
        availability:employee_availability(*),
        unavailability:employee_unavailability(*)`
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) throw error;

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      branchId,
      employmentType,
      startDate,
      endDate,
      hourlyRate,
      isActive,
    } = body;

    const { data: employee, error } = await (supabase.from("employees") as any)
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        branch_id: branchId,
        employment_type: employmentType,
        start_date: startDate,
        end_date: endDate,
        hourly_rate: hourlyRate,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Log to audit logs
    if (userData) {
      await (supabase.from("audit_logs") as any).insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        action: "update",
        entity_type: "employees",
        entity_id: id,
        changes: { employee },
      });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: employee, error } = await (supabase.from("employees") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Log to audit logs
    if (userData) {
      await (supabase.from("audit_logs") as any).insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        action: "delete",
        entity_type: "employees",
        entity_id: id,
      });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
