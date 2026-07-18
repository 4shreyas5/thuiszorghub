import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - user not authenticated" }, { status: 401 });
    }

    const { firstName, lastName, timezone, language } = await request.json();

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

    // Create user profile
    const { data: userProfile, error } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        first_name: firstName || user.user_metadata?.first_name || "",
        last_name: lastName || user.user_metadata?.last_name || "",
        timezone: timezone || user.user_metadata?.timezone || "UTC",
        language: language || user.user_metadata?.language || "en",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user profile:", error);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }

    return NextResponse.json({ data: userProfile }, { status: 201 });
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
