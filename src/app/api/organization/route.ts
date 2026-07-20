import { createServerClient, createServerAdminClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

// Deliberately no permission gate beyond org membership: this feeds the
// app shell (org name/branding in AdminSidebar, shown to every role), so
// it must stay readable by any authenticated member of the org, not just
// organization.view holders (Owner/Auditor) - gating it would break the
// sidebar for every other role.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const { data: organization, error } = await context.supabase
      .from("organizations")
      .select("*")
      .eq("id", context.organizationId)
      .single();

    if (error) throw error;

    return NextResponse.json({ data: organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check auth with regular client
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Bootstrap only - a user who already belongs to an organization must
    // not be able to silently re-provision themselves into a brand new one
    // (this upserts on users.id further down, which would otherwise orphan
    // their existing organization membership without any warning).
    const { data: existingProfile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .eq("is_deleted", false)
      .maybeSingle();

    if (existingProfile?.organization_id) {
      return NextResponse.json({ error: "You already belong to an organization" }, { status: 409 });
    }

    const body = await request.json();
    const {
      name,
      legalName,
      email,
      phone,
      website,
      kvkNumber,
      vatNumber,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      primaryLanguage,
      timezone,
      currency,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    console.log("[org POST] Creating organization for user:", user.id, "with name:", name);

    // Use admin client to bypass RLS policies (this is a privileged operation)
    const adminClient = await createServerAdminClient();

    // Create organization
    const { data: organization, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name,
        legal_name: legalName || null,
        email: email || user.email,
        phone: phone || null,
        website: website || null,
        kvk_number: kvkNumber || null,
        vat_number: vatNumber || null,
        address_line_1: addressLine1,
        address_line_2: addressLine2 || null,
        city: city,
        postal_code: postalCode,
        country: country || "NL",
        primary_language: primaryLanguage || "nl",
        timezone: timezone || "Europe/Amsterdam",
        currency: currency || "EUR",
      })
      .select()
      .single();

    if (orgError) {
      console.error("[org POST] Error creating organization:", orgError);
      throw orgError;
    }

    console.log("[org POST] Organization created:", organization?.id);

    // Create organization settings
    console.log("[org POST] Creating organization settings...");
    const { error: settingsError } = await adminClient.from("organization_settings").insert({
      organization_id: organization.id,
      date_format: "DD-MM-YYYY",
      time_format: "24h",
      currency: currency || "EUR",
      work_week_start: 1,
      default_visit_duration: 60,
      timezone: timezone || "Europe/Amsterdam",
      language: primaryLanguage || "nl",
    });

    if (settingsError) {
      console.error("[org POST] Error creating organization settings:", settingsError);
      throw settingsError;
    }
    console.log("[org POST] Organization settings created successfully");

    // Create default branch
    console.log("[org POST] Creating default branch...");
    const { error: branchError } = await adminClient.from("branches").insert({
      organization_id: organization.id,
      name: `${name} - Main`,
      email: email || user.email,
      phone: phone || null,
      address_line_1: addressLine1,
      address_line_2: addressLine2 || null,
      city: city,
      postal_code: postalCode,
      country: country || "NL",
    });

    if (branchError) {
      console.error("[org POST] Error creating branch:", branchError);
      throw branchError;
    }
    console.log("[org POST] Branch created successfully");

    // Create or update the user's profile row now that an organization exists
    // (users.organization_id is NOT NULL, so this row cannot exist before this point)
    console.log("[org POST] Upserting user with organization...");
    const { error: userError } = await adminClient.from("users").upsert({
      id: user.id,
      organization_id: organization.id,
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      email: user.email || "",
      timezone: timezone || "Europe/Amsterdam",
      language: primaryLanguage || "nl",
      is_active: true,
    });

    if (userError) {
      console.error("[org POST] Error updating user:", userError);
      throw userError;
    }
    console.log("[org POST] User updated successfully");

    // Seed default system roles for the new organization and assign the
    // creator as Organization Owner. (This previously looked up a role
    // named "Admin" that was never created anywhere, so it silently did
    // nothing - no organization ever got any roles.)
    console.log("[org POST] Seeding default roles...");
    const { data: allPermissions } = await adminClient.from("permissions").select("id, code");

    const permissionIdByCode = new Map<string, string>(
      (allPermissions || []).map((p: { id: string; code: string }) => [p.code, p.id])
    );

    const roleDefinitions: Array<{ name: string; description: string; codes: string[] | "all" }> = [
      { name: "Organization Owner", description: "Full organization access", codes: "all" },
      {
        name: "Branch Manager",
        description: "Branch-level management",
        codes: [
          "branch.view",
          "employee.view",
          "employee.create",
          "employee.update",
          "client.view",
          "client.create",
          "client.update",
          "schedule.view",
          "schedule.create",
          "visit.view",
          "visit.create",
          "visit.update",
          "visit.manage",
          "document.view",
          "report.view",
          "settings.view",
          "dashboard.view",
        ],
      },
      {
        name: "Scheduler",
        description: "Schedule and planning",
        codes: [
          "schedule.view",
          "schedule.create",
          "schedule.update",
          "schedule.assign",
          "employee.view",
          "client.view",
          "visit.view",
          "visit.create",
          "visit.update",
          "visit.complete",
          "dashboard.view",
          "notification.view",
        ],
      },
      {
        name: "Administrator",
        description: "Office administration",
        codes: [
          "client.view",
          "client.create",
          "client.update",
          "employee.view",
          "document.view",
          "document.upload",
          "document.download",
          "notification.view",
          "notification.send",
          "dashboard.view",
          "settings.view",
        ],
      },
      {
        name: "Caregiver",
        description: "Field caregiver",
        codes: [
          "schedule.view",
          "client.view",
          "visit.view",
          "visit.complete",
          "document.view",
          "document.upload",
          "notification.view",
          "dashboard.view",
        ],
      },
      {
        name: "Finance",
        description: "Financial management",
        codes: ["billing.view", "billing.export", "report.view", "report.export", "dashboard.view"],
      },
      {
        name: "Auditor",
        description: "Read-only audit access",
        codes: [
          "audit.view",
          "organization.view",
          "user.view",
          "employee.view",
          "client.view",
          "document.view",
          "report.view",
          "dashboard.view",
        ],
      },
    ];

    let ownerRoleId: string | null = null;

    for (const roleDef of roleDefinitions) {
      const { data: createdRole, error: roleError } = await adminClient
        .from("roles")
        .insert({
          organization_id: organization.id,
          name: roleDef.name,
          description: roleDef.description,
          is_system: true,
        })
        .select("id")
        .single();

      if (roleError || !createdRole) {
        console.error(`[org POST] Error creating role ${roleDef.name}:`, roleError);
        continue;
      }

      if (roleDef.name === "Organization Owner") {
        ownerRoleId = createdRole.id;
      }

      const codes = roleDef.codes === "all" ? Array.from(permissionIdByCode.keys()) : roleDef.codes;
      const rolePermissionRows = codes
        .map((code) => permissionIdByCode.get(code))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ role_id: createdRole.id, permission_id: permissionId }));

      if (rolePermissionRows.length > 0) {
        await adminClient.from("role_permissions").insert(rolePermissionRows);
      }
    }

    if (ownerRoleId) {
      await adminClient.from("user_roles").insert({
        user_id: user.id,
        role_id: ownerRoleId,
        assigned_by: user.id,
      });
      console.log("[org POST] Organization Owner role assigned");
    }

    console.log("[org POST] Organization setup completed successfully");
    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);

    // Surface unique-constraint violations with a specific, actionable message
    const dbError = error as { code?: string; details?: string; message?: string };
    if (dbError?.code === "23505") {
      const field = dbError.details?.includes("email")
        ? "email address"
        : dbError.details?.includes("kvk_number")
          ? "KVK number"
          : "value";
      return NextResponse.json(
        { error: `An organization with this ${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "organization.update");
    if (permError) return permError;

    const body = await request.json();
    const {
      name,
      legalName,
      kvkNumber,
      vatNumber,
      email,
      phone,
      website,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      primaryLanguage,
      timezone,
      currency,
    } = body;

    const { data: organizations, error } = await supabase
      .from("organizations")
      .update({
        name: name || undefined,
        legal_name: legalName || undefined,
        kvk_number: kvkNumber || undefined,
        vat_number: vatNumber || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address_line_1: addressLine1 || undefined,
        address_line_2: addressLine2 || undefined,
        city: city || undefined,
        postal_code: postalCode || undefined,
        country: country || undefined,
        primary_language: primaryLanguage || undefined,
        timezone: timezone || undefined,
        currency: currency || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.organizationId)
      .select();

    if (error) throw error;

    if (!organizations || organizations.length === 0) {
      console.error("[org PUT] UPDATE matched 0 rows for organization_id:", context.organizationId);
      return NextResponse.json(
        { error: "Organization not found or you do not have permission to update it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: organizations[0] });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
