import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
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
    await supabase.from("document_audit_logs").insert({
      organization_id: context.organizationId,
      document_id: id,
      user_id: context.userId,
      action: "download",
    });

    // Return file
    const headers = new Headers();
    headers.set("Content-Type", document.mime_type);
    headers.set("Content-Disposition", `attachment; filename="${document.file_name}"`);
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(fileData, { headers });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
