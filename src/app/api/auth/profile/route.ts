import { createServerClient } from "@/core/database/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Get authenticated user from Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile from users table
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !userProfile) {
      // User doesn't have a profile row yet - caller (auth-context) creates one
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: userProfile.id,
      userId: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.first_name || "",
      lastName: userProfile.last_name || "",
      timezone: userProfile.timezone || "UTC",
      language: userProfile.language || "en",
      isActive: userProfile.is_active !== false,
      organizationId: userProfile.organization_id || "",
      createdAt: userProfile.created_at,
      updatedAt: userProfile.updated_at,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
