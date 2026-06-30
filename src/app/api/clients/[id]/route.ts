/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: client, error } = await (supabase.from("clients") as any)
      .select(`*,
        branch:branches(id, name),
        addresses:client_addresses(*),
        insurance:client_insurance(*),
        contacts:client_contacts(*)
      `)
      .eq("id", id)
      .eq("is_deleted", false)
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

    const {
      first_name,
      last_name,
      date_of_birth,
      email,
      phone,
      branch_id,
      case_status,
      risk_level,
      is_active,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      address_line_1,
      address_line_2,
      postal_code,
      city,
      country,
      insurance_provider,
      policy_number,
    } = body;

    // Get user organization
    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update main client info
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (case_status !== undefined) updateData.case_status = case_status;
    if (risk_level !== undefined) updateData.risk_level = risk_level;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (emergency_contact_name !== undefined) updateData.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined) updateData.emergency_contact_phone = emergency_contact_phone;
    if (notes !== undefined) updateData.notes = notes;

    const { data: client, error: updateError } = await (supabase.from("clients") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update address if provided
    if (address_line_1 || postal_code || city) {
      const { data: existingAddress } = await (supabase.from("client_addresses") as any)
        .select("id")
        .eq("client_id", id)
        .eq("is_primary", true)
        .single();

      if (existingAddress) {
        await (supabase.from("client_addresses") as any)
          .update({
            address_line_1,
            address_line_2,
            postal_code,
            city,
            country: country || "Netherlands",
          })
          .eq("id", existingAddress.id);
      } else {
        await (supabase.from("client_addresses") as any).insert({
          client_id: id,
          address_type: "primary",
          address_line_1,
          address_line_2,
          postal_code,
          city,
          country: country || "Netherlands",
          is_primary: true,
        });
      }
    }

    // Update insurance if provided
    if (insurance_provider !== undefined || policy_number !== undefined) {
      const { data: existingInsurance } = await (supabase.from("client_insurance") as any)
        .select("id")
        .eq("client_id", id)
        .single();

      if (existingInsurance) {
        await (supabase.from("client_insurance") as any)
          .update({
            insurance_provider,
            policy_number,
          })
          .eq("id", existingInsurance.id);
      } else {
        await (supabase.from("client_insurance") as any).insert({
          client_id: id,
          insurance_provider,
          policy_number,
        });
      }
    }

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
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
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
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
