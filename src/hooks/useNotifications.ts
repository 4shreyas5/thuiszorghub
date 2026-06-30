import { useState, useCallback } from "react";

export interface NotificationFilter {
  isRead?: boolean;
  isArchived?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (filters?: NotificationFilter) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.isRead !== undefined) params.append("isRead", String(filters.isRead));
      if (filters?.isArchived !== undefined) params.append("isArchived", String(filters.isArchived));
      if (filters?.type) params.append("type", filters.type);
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotification = useCallback(
    async (payload: {
      notificationType: string;
      title: string;
      message: string;
      actionUrl?: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to create notification");

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsArchived = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });

      if (!response.ok) throw new Error("Failed to archive notification");

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAsArchived,
    deleteNotification,
  };
}
