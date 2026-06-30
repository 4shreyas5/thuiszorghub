import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(document.bucket_name)
      .download(document.file_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 400 });
    }

    // Log download action
    await supabase
      .from("document_audit_logs")
      .insert({
        organization_id: userData.organization_id,
        document_id: id,
        user_id: user.id,
        action: "download",
      });

    // Return file
    const headers = new Headers();
    headers.set("Content-Type", document.mime_type);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${document.file_name}"`
    );
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(fileData, { headers });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
