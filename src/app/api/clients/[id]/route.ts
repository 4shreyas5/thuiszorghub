/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateClientSchema } from "@/core/validation/client";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // No is_deleted filter here on purpose: archived clients must stay
    // viewable on their own detail page (they remain in history and stay
    // linked to their past visits/assignments/care plans) - only list
    // views default to hiding archived clients.
    const { data: client, error } = await (supabase.from("clients") as any)
      .select(
        `*,
        branch:branches(id, name),
        addresses:client_addresses(*),
        insurance:client_insurance(*),
        contacts:client_contacts(*),
        medical_info:client_medical_info(*),
        allergies:client_allergies(*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message || "Invalid client data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      email: data.email,
      phone: data.phone,
      branch_id: data.branch_id,
      case_status: data.case_status,
      risk_level: data.risk_level,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    };

    // status is the source of truth going forward - is_active/is_deleted
    // are mirrored from it in the same write, same convention as
    // employees, so every existing consumer of those two booleans keeps
    // working unchanged. Without this, PUT could never clear is_deleted,
    // meaning an archived client could never be reactivated.
    if (data.status !== undefined) {
      updateData.status = data.status;
      updateData.is_active = data.status === "active";
      updateData.is_deleted = data.status === "archived";
      updateData.deleted_at = data.status === "archived" ? new Date().toISOString() : null;
    } else if (data.is_active !== undefined) {
      updateData.is_active = data.is_active;
      updateData.status = data.is_active ? "active" : "inactive";
    }

    const { data: client, error: updateError } = await (supabase.from("clients") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update address if provided
    if (data.address_line_1 || data.postal_code || data.city) {
      const { data: existingAddress } = await (supabase.from("client_addresses") as any)
        .select("id")
        .eq("client_id", id)
        .eq("is_primary", true)
        .single();

      if (existingAddress) {
        await (supabase.from("client_addresses") as any)
          .update({
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2,
            postal_code: data.postal_code,
            city: data.city,
            country: data.country || "Netherlands",
          })
          .eq("id", existingAddress.id);
      } else {
        await (supabase.from("client_addresses") as any).insert({
          client_id: id,
          address_type: "primary",
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          postal_code: data.postal_code,
          city: data.city,
          country: data.country || "Netherlands",
          is_primary: true,
        });
      }
    }

    // Update insurance if provided
    if (data.insurance_provider !== undefined || data.policy_number !== undefined) {
      const { data: existingInsurance } = await (supabase.from("client_insurance") as any)
        .select("id")
        .eq("client_id", id)
        .single();

      if (existingInsurance) {
        await (supabase.from("client_insurance") as any)
          .update({
            insurance_provider: data.insurance_provider,
            policy_number: data.policy_number,
          })
          .eq("id", existingInsurance.id);
      } else {
        await (supabase.from("client_insurance") as any).insert({
          client_id: id,
          insurance_provider: data.insurance_provider,
          policy_number: data.policy_number,
        });
      }
    }

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: user?.id,
      event_type: "UPDATE",
      resource_type: "clients",
      resource_id: id,
      action: "updated",
      changes: { updates: updateData },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete client
    const { data: client, error } = await (supabase.from("clients") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
        status: "archived",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: user?.id,
      event_type: "DELETE",
      resource_type: "clients",
      resource_id: id,
      action: "archived",
      changes: { deleted_at: new Date().toISOString() },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error archiving client:", error);
    return NextResponse.json({ error: "Failed to archive client" }, { status: 500 });
  }
}
