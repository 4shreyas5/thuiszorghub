import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

// Application configuration for the organization - distinct from company
// info (name, address, KVK, etc.), which lives on /api/organization.
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("[settings GET] Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: settings, error } = await supabase
      .from("organization_settings")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .single();

    if (error || !settings) {
      console.error("[settings GET] Error fetching settings:", error);
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("[settings PUT] Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      timezone,
      currency,
      language,
      dateFormat,
      timeFormat,
      workWeekStart,
      defaultVisitDuration,
      notificationEmailEnabled,
      notificationSmsEnabled,
      notificationPushEnabled,
      emailFromName,
      emailFromAddress,
      emailReplyTo,
      sessionTimeoutMinutes,
      mfaRequired,
      brandPrimaryColor,
      brandSecondaryColor,
    } = body;

    const { data: settings, error } = await supabase
      .from("organization_settings")
      .update({
        timezone: timezone ?? undefined,
        currency: currency ?? undefined,
        language: language ?? undefined,
        date_format: dateFormat ?? undefined,
        time_format: timeFormat ?? undefined,
        work_week_start: workWeekStart ?? undefined,
        default_visit_duration: defaultVisitDuration ?? undefined,
        notification_email_enabled: notificationEmailEnabled ?? undefined,
        notification_sms_enabled: notificationSmsEnabled ?? undefined,
        notification_push_enabled: notificationPushEnabled ?? undefined,
        email_from_name: emailFromName ?? undefined,
        email_from_address: emailFromAddress ?? undefined,
        email_reply_to: emailReplyTo ?? undefined,
        session_timeout_minutes: sessionTimeoutMinutes ?? undefined,
        mfa_required: mfaRequired ?? undefined,
        brand_primary_color: brandPrimaryColor ?? undefined,
        brand_secondary_color: brandSecondaryColor ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", userData.organization_id)
      .select();

    if (error) {
      console.error("[settings PUT] Error updating settings:", error);
      throw error;
    }

    if (!settings || settings.length === 0) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json({ data: settings[0] });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
