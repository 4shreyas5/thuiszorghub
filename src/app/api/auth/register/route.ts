import { createServerClient } from "@/core/database/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - user not authenticated" }, { status: 401 });
    }

    // Check if user already has a profile
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { data: { message: "User profile already exists" } },
        { status: 200 }
      );
    }

    // A brand-new signup never has an organization yet at this point in the
    // flow (organization only exists once onboarding is submitted), and
    // users.organization_id is NOT NULL - so inserting a profile row here is
    // guaranteed to fail with a 23502 not-null violation every single time,
    // regardless of the supplied data. This isn't a transient error to
    // retry: POST /api/organization is what actually creates this user's
    // profile row (with the real organization_id) once onboarding
    // completes - see its "Upserting user with organization" step, which is
    // the source of truth. Returning success here (without attempting a
    // doomed insert) avoids logging a guaranteed error on every signup while
    // leaving that real profile creation exactly where it already is.
    return NextResponse.json(
      { data: { message: "Profile will be created when onboarding completes" } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
