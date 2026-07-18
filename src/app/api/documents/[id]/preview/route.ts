import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sibling of the download route - same lookup/storage-fetch logic, but
 * Content-Disposition: inline so the browser renders the file (PDF/image)
 * instead of forcing a download.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(document.bucket_name)
      .download(document.file_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to load file" }, { status: 400 });
    }

    await supabase.from("document_audit_logs").insert({
      organization_id: userData.organization_id,
      document_id: id,
      user_id: user.id,
      action: "preview",
    });

    const headers = new Headers();
    headers.set("Content-Type", document.mime_type);
    headers.set("Content-Disposition", `inline; filename="${document.file_name}"`);
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(fileData, { headers });
  } catch (error) {
    console.error("Error previewing document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
