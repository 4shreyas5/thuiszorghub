import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "settings.view");
    if (permError) return permError;

    const { data: template, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "settings.manage");
    if (permError) return permError;

    const body = await request.json();
    const {
      templateName,
      subjectTemplate,
      bodyHtmlTemplate,
      bodyTextTemplate,
      variables,
      isActive,
    } = body;

    const { data: template, error } = await supabase
      .from("email_templates")
      .update({
        template_name: templateName,
        subject_template: subjectTemplate,
        body_html_template: bodyHtmlTemplate,
        body_text_template: bodyTextTemplate,
        variables: variables,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
