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

    const organizationId = userData.organization_id;
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      entityType: searchParams.get("entityType"),
      entityId: searchParams.get("entityId"),
      documentType: searchParams.get("documentType"),
      search: searchParams.get("search"),
      verificationStatus: searchParams.get("verificationStatus"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    let query = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (filters.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    if (filters.entityId) {
      query = query.eq("entity_id", filters.entityId);
    }

    if (filters.documentType) {
      query = query.eq("document_type", filters.documentType);
    }

    if (filters.verificationStatus) {
      query = query.eq("verification_status", filters.verificationStatus);
    }

    if (filters.search) {
      query = query.ilike("file_name", `%${filters.search}%`);
    }

    const offset = (filters.page - 1) * filters.limit;
    const { data: documents, count, error } = await query
      .range(offset, offset + filters.limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: documents || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / filters.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
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

    const organizationId = userData.organization_id;
    const formData = await request.formData();

    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const documentType = formData.get("documentType") as string;
    const expiryDate = formData.get("expiryDate") as string;
    const file = formData.get("file") as File;

    if (!entityType || !entityId || !documentType || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    // Allowed MIME types
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    const bucketName = "documents";
    const timestamp = Date.now();
    const filePath = `${organizationId}/${entityType}/${entityId}/${timestamp}-${file.name}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        bucket_name: bucketName,
        uploaded_by: user.id,
        expiry_date: expiryDate || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Log the action
    await supabase
      .from("document_audit_logs")
      .insert({
        organization_id: organizationId,
        document_id: document.id,
        user_id: user.id,
        action: "upload",
        action_details: { file_name: file.name, file_size: file.size },
      });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
