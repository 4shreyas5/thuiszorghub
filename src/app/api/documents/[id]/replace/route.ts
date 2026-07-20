import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "document.update");
    if (permError) return permError;

    const { data: oldDocument } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (!oldDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const changeNotes = formData.get("changeNotes") as string;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Get current version number
    const { data: versions } = await supabase
      .from("document_versions")
      .select("version_number")
      .eq("document_id", id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 1) + 1;

    // Upload new file
    const timestamp = Date.now();
    const newFilePath = `${context.organizationId}/${oldDocument.entity_type}/${oldDocument.entity_id}/${timestamp}-${file.name}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(oldDocument.bucket_name)
      .upload(newFilePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create version record
    await supabase.from("document_versions").insert({
      document_id: id,
      version_number: nextVersion,
      file_path: newFilePath,
      file_size: file.size,
      created_by: context.userId,
      change_notes: changeNotes,
      is_current: true,
    });

    // Mark previous version as not current
    if (nextVersion > 1) {
      await supabase
        .from("document_versions")
        .update({ is_current: false })
        .eq("document_id", id)
        .neq("version_number", nextVersion);
    }

    // Update document record
    const { data: updatedDocument } = await supabase
      .from("documents")
      .update({
        file_path: newFilePath,
        file_size: file.size,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    // Log the action
    await supabase.from("document_audit_logs").insert({
      organization_id: context.organizationId,
      document_id: id,
      user_id: context.userId,
      action: "replace",
      action_details: {
        version_number: nextVersion,
        file_name: file.name,
        file_size: file.size,
      },
    });

    return NextResponse.json({ data: updatedDocument });
  } catch (error) {
    console.error("Error replacing document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
