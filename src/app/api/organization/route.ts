import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
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

    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", userData.organization_id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data: organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { data: organization, error } = await supabase
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
      .eq("id", userData.organization_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: organization });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
