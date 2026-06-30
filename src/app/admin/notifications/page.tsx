"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/core/context/auth-context";
import { PageHeader } from "@/components/admin/PageHeader";
import { format } from "date-fns";
import { Trash2, Archive, Mail, CheckCircle2, Circle } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  action_url?: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === "unread") params.append("isRead", "false");
      if (filter === "archived") params.append("isArchived", "true");

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAsArchived(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="System notifications" />
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "All notifications read"
        }
      />

      {/* Filters */}
      <div className="flex gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "unread"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("archived")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "archived"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Archived
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition ${
                notification.is_read
                  ? "bg-white border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {notification.is_read ? (
                    <CheckCircle2 className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      {format(new Date(notification.created_at), "PPp")}
                    </p>
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => markAsArchived(notification.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    title="Archive"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
