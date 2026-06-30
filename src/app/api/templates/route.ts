import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const templateKey = searchParams.get("templateKey");

    let query = supabase
      .from("email_templates")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .eq("is_active", true);

    if (templateKey) {
      query = query.eq("template_key", templateKey);
    }

    const { data: templates, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: templates || [] });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      templateKey,
      templateName,
      subjectTemplate,
      bodyHtmlTemplate,
      bodyTextTemplate,
      variables,
    } = body;

    if (!templateKey || !templateName || !subjectTemplate || !bodyHtmlTemplate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("email_templates")
      .insert({
        organization_id: userData.organization_id,
        template_key: templateKey,
        template_name: templateName,
        subject_template: subjectTemplate,
        body_html_template: bodyHtmlTemplate,
        body_text_template: bodyTextTemplate,
        variables: variables || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
