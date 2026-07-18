"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/core/context/auth-context";
import { PageHeader } from "@/components/admin/PageHeader";
import { Upload, Download, Trash2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  entity_type: string;
  entity_id: string;
  verification_status: string;
  expiry_date?: string;
  uploaded_at: string;
  uploaded_by: string;
  file_size: number;
}

export default function DocumentsPage() {
  const { isLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadEntityType, setUploadEntityType] = useState<string>("");
  const [uploadEntityId, setUploadEntityId] = useState<string>("");
  const [uploadDocumentType, setUploadDocumentType] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");

  const ENTITY_TYPES = ["employee", "client", "visit", "care_plan", "invoice", "branch"];
  const DOCUMENT_TYPES: Record<string, string[]> = {
    employee: [
      "employment_contract",
      "passport",
      "national_id",
      "driving_licence",
      "certificates",
      "training_certificates",
      "background_check",
      "insurance",
      "other",
    ],
    client: [
      "referral",
      "consent_forms",
      "insurance_card",
      "medical_documents",
      "care_plan_pdf",
      "assessment",
      "identification",
      "other",
    ],
    visit: ["photos", "attachments", "incident_reports", "signed_forms", "completion_documents"],
    care_plan: ["pdf", "goals", "tasks", "reviews"],
    invoice: ["invoice_pdf", "payment_receipt", "credit_notes", "attachments"],
  };

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityType) params.append("entityType", entityType);
      params.append("limit", "50");

      const response = await fetch(`/api/documents?${params}`);
      const data = await response.json();

      setDocuments(data.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchDocuments();
    });
  }, [fetchDocuments]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!uploadFile || !uploadEntityType || !uploadEntityId || !uploadDocumentType) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("entityType", uploadEntityType);
      formData.append("entityId", uploadEntityId);
      formData.append("documentType", uploadDocumentType);
      if (expiryDate) formData.append("expiryDate", expiryDate);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      alert("Document uploaded successfully!");
      setUploadFile(null);
      setUploadEntityType("");
      setUploadEntityId("");
      setUploadDocumentType("");
      setExpiryDate("");
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    }
  }

  async function downloadDocument(doc: Document) {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document");
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      alert("Document deleted successfully!");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Documents" description="Manage documents" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Upload and manage documents" />

      {/* Upload Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Document
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={uploadEntityType}
                onChange={(e) => {
                  setUploadEntityType(e.target.value);
                  setUploadDocumentType("");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select entity type</option>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ").charAt(0).toUpperCase() +
                      type.replace("_", " ").slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
              <input
                type="text"
                value={uploadEntityId}
                onChange={(e) => setUploadEntityId(e.target.value)}
                placeholder="UUID or ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {uploadEntityType && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={uploadDocumentType}
                  onChange={(e) => setUploadDocumentType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select document type</option>
                  {DOCUMENT_TYPES[uploadEntityType]?.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File (Max 50MB)</label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
          >
            Upload Document
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No documents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">{doc.file_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doc.document_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doc.entity_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {doc.verification_status === "verified" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Verified</span>
                          </>
                        ) : doc.verification_status === "expired" ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">Expired</span>
                          </>
                        ) : (
                          <span className="text-gray-600">Unverified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(doc.uploaded_at), "PP")}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => downloadDocument(doc)}
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
