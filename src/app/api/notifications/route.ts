import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      isRead: searchParams.get("isRead"),
      isArchived: searchParams.get("isArchived"),
      type: searchParams.get("type"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (filters.isRead !== null && filters.isRead !== "") {
      query = query.eq("is_read", filters.isRead === "true");
    }

    if (filters.isArchived !== null && filters.isArchived !== "") {
      query = query.eq("is_archived", filters.isArchived === "true");
    }

    if (filters.type) {
      query = query.eq("notification_type", filters.type);
    }

    const offset = (filters.page - 1) * filters.limit;
    const { data: notifications, count, error } = await query
      .range(offset, offset + filters.limit - 1);

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .eq("is_deleted", false);

    return NextResponse.json({
      data: notifications || [],
      unreadCount: unreadCount || 0,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / filters.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
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

    const body = await request.json();
    const {
      notificationType,
      title,
      message,
      actionUrl,
      entityType,
      entityId,
      metadata,
    } = body;

    if (!notificationType || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        notification_type: notificationType,
        title,
        message,
        action_url: actionUrl,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
