/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClientSchema } from "@/core/validation/client";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

const VALID_STATUSES = ["active", "inactive", "archived"];

// Deliberately no permission gate on GET beyond org membership - client
// names/ids feed pickers on Assignments/Care Plans/Visits/Scheduling/
// Reports used by most roles for everyday work - only the mutation
// endpoints below are gated.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    // active | inactive | archived | all | "" (default: everything but archived)
    const status = searchParams.get("status") || "";
    const caseStatus = searchParams.get("caseStatus") || "";
    const branch = searchParams.get("branch") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Shared filter application, reused for the single query below. This
    // used to back two separate round trips (a data query and a second,
    // identically-filtered count-only query) - now count comes from the
    // same query via { count: "exact" }, halving the round trips with no
    // change to which rows are counted.
    const applyFilters = (q: any) => {
      q = q.eq("organization_id", context.organizationId);

      if (search) {
        q = q.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }
      if (branch) {
        q = q.eq("branch_id", branch);
      }
      if (caseStatus) {
        q = q.eq("case_status", caseStatus);
      }
      if (VALID_STATUSES.includes(status)) {
        q = q.eq("status", status);
      } else if (status !== "all") {
        q = q.neq("status", "archived");
      }
      return q;
    };

    // No address join here - the list doesn't display it, only the detail
    // page needs it. Assignments joined so "Assigned Employee(s)" doesn't
    // need a per-row fetch.
    const query = applyFilters(
      (supabase.from("clients") as any).select(
        `*,
        branch:branches(id, name),
        assignments:employee_client_assignments(is_primary, employee:employees(first_name, last_name))`,
        { count: "exact" }
      )
    ).order(sortBy, { ascending: sortOrder === "asc" });

    const { data: clients, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      clients: clients || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "client.create");
    if (permError) return permError;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
    }
    const parsed = createClientSchema.safeParse(body);

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

    // Check for duplicate email if provided
    if (data.email) {
      const { data: existing } = await (supabase.from("clients") as any)
        .select("id")
        .eq("email", data.email)
        .eq("organization_id", context.organizationId)
        .eq("is_deleted", false);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: "A client with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Create client
    const { data: client, error: clientError } = await (supabase.from("clients") as any)
      .insert({
        organization_id: context.organizationId,
        branch_id: data.branch_id,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth || null,
        email: data.email || null,
        phone: data.phone || null,
        case_status: data.case_status,
        risk_level: data.risk_level || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        notes: data.notes || null,
        status: "active",
        is_active: true,
      })
      .select()
      .single();

    if (clientError) throw clientError;

    // Create address if provided
    if (data.address_line_1 || data.postal_code || data.city) {
      await (supabase.from("client_addresses") as any).insert({
        client_id: client.id,
        address_type: "primary",
        address_line_1: data.address_line_1 || "",
        address_line_2: data.address_line_2 || null,
        postal_code: data.postal_code || "",
        city: data.city || "",
        country: data.country || "Netherlands",
        is_primary: true,
      });
    }

    // Create insurance info if provided
    if (data.insurance_provider || data.policy_number) {
      await (supabase.from("client_insurance") as any).insert({
        client_id: client.id,
        insurance_provider: data.insurance_provider || null,
        policy_number: data.policy_number || null,
      });
    }

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "clients",
      resourceId: client.id,
      action: "created",
      changes: { new_values: client },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
