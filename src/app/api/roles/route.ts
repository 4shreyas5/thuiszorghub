import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "role.view");
    if (permError) return permError;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get roles with their permissions
    const {
      data: roles,
      error: rolesError,
      count,
    } = await supabase
      .from("roles")
      .select(
        `
        id,
        name,
        description,
        is_system,
        created_at,
        role_permissions(permissions(id, module, action, code, description))
        `,
        { count: "exact" }
      )
      .eq("organization_id", context.organizationId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (rolesError) throw rolesError;

    return NextResponse.json({
      data: roles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permCheck = await requirePermission(context, "role.create");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const { data: role, error } = await supabase
      .from("roles")
      .insert({
        organization_id: context.organizationId,
        name,
        description,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const { error: permError } = await supabase.from("role_permissions").insert(
        permissionIds.map((permissionId: string) => ({
          role_id: role.id,
          permission_id: permissionId,
        }))
      );
      if (permError) console.error("[roles POST] Error assigning permissions:", permError);
    }

    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    const dbError = error as { code?: string };
    if (dbError?.code === "23505") {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
