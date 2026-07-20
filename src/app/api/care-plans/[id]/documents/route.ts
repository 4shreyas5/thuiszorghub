/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

// No permission gate beyond org membership - see care-plans/route.ts.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    const { data, error } = await (context.supabase.from("care_plan_documents") as any)
      .select("*")
      .eq("care_plan_id", id);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "care_plan.create");
    if (permError) return permError;

    const { id } = await params;
    const body = await request.json();

    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    const { data, error } = await (context.supabase.from("care_plan_documents") as any)
      .insert([{ ...body, care_plan_id: id }])
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
