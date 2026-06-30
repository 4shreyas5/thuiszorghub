import { useState, useCallback } from "react";

export interface DocumentUploadOptions {
  entityType: string;
  entityId: string;
  documentType: string;
  expiryDate?: string;
}

export interface DocumentFilter {
  entityType?: string;
  entityId?: string;
  documentType?: string;
  search?: string;
  verificationStatus?: string;
  page?: number;
  limit?: number;
}

export function useDocuments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useCallback(
    async (file: File, options: DocumentUploadOptions) => {
      try {
        setLoading(true);
        setError(null);

        // Validate file size
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_FILE_SIZE) {
          throw new Error("File too large (max 50MB)");
        }

        // Validate MIME type
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
          throw new Error("Unsupported file type");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", options.entityType);
        formData.append("entityId", options.entityId);
        formData.append("documentType", options.documentType);
        if (options.expiryDate) {
          formData.append("expiryDate", options.expiryDate);
        }

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();
        return data.data;
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

  const fetchDocuments = useCallback(async (filters?: DocumentFilter) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.entityType) params.append("entityType", filters.entityType);
      if (filters?.entityId) params.append("entityId", filters.entityId);
      if (filters?.documentType) params.append("documentType", filters.documentType);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.verificationStatus)
        params.append("verificationStatus", filters.verificationStatus);
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error("Failed to fetch documents");

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

  const downloadDocument = useCallback(async (documentId: string, fileName: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceDocument = useCallback(
    async (documentId: string, file: File, changeNotes?: string) => {
      try {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        if (changeNotes) {
          formData.append("changeNotes", changeNotes);
        }

        const response = await fetch(`/api/documents/${documentId}/replace`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Replace failed");

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

  const searchDocuments = useCallback(async (query: string, limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("q", query);
      params.append("limit", String(limit));

      const response = await fetch(`/api/documents/search?${params}`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      return data.data || [];
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
    uploadDocument,
    fetchDocuments,
    downloadDocument,
    deleteDocument,
    replaceDocument,
    searchDocuments,
  };
}
