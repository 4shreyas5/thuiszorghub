 
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  BarChart3
} from "lucide-react";
import { supabase } from "@/core/database/client";
import { useRouter } from "next/navigation";

export function AdminSidebar() {
  const [expandedSection, setExpandedSection] = useState<string | null>("administration");
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">ThuisZorgHub</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Dashboard */}
        <Link
          href="/admin"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        {/* Administration Section */}
        <div>
          <button
            onClick={() => toggleSection("administration")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              Administration
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "administration" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "administration" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/organization"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Organization
              </Link>
              <Link
                href="/admin/branches"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Branches
              </Link>
              <Link
                href="/admin/users"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Users
              </Link>
              <Link
                href="/admin/roles"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Roles
              </Link>
              <Link
                href="/admin/permissions"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Permissions
              </Link>
              <Link
                href="/admin/settings"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Settings
              </Link>
            </div>
          )}
        </div>

        {/* Operations Section */}
        <div>
          <button
            onClick={() => toggleSection("operations")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <Briefcase className="w-5 h-5" />
              Operations
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "operations" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "operations" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/employees"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Employees
              </Link>
              <Link
                href="/admin/clients"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Clients
              </Link>
              <Link
                href="/admin/assignments"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Assignments
              </Link>
            </div>
          )}
        </div>

        {/* Clinical Section */}
        <div>
          <button
            onClick={() => toggleSection("clinical")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Clinical
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "clinical" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "clinical" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/care-plans"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Care Plans
              </Link>
            </div>
          )}
        </div>

        {/* Scheduling Section */}
        <div>
          <button
            onClick={() => toggleSection("scheduling")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              Scheduling
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "scheduling" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "scheduling" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/scheduling"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Visits
              </Link>
            </div>
          )}
        </div>

        {/* Billing Section */}
        <div>
          <button
            onClick={() => toggleSection("billing")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" />
              Billing
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "billing" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "billing" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/billing"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/billing/invoices"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Invoices
              </Link>
              <Link
                href="/admin/billing/payments"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Payments
              </Link>
              <Link
                href="/admin/billing/timesheets"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Timesheets
              </Link>
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div>
          <button
            onClick={() => toggleSection("reports")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5" />
              Reports
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "reports" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "reports" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/reports"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Analytics
              </Link>
            </div>
          )}
        </div>

        {/* System Section */}
        <div>
          <button
            onClick={() => toggleSection("system")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <span className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              System
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${expandedSection === "system" ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSection === "system" && (
            <div className="mt-2 space-y-1 pl-6">
              <Link
                href="/admin/audit-logs"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Audit Logs
              </Link>
              <Link
                href="/admin/notifications"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Notifications
              </Link>
              <Link
                href="/admin/documents"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Documents
              </Link>
              <Link
                href="/admin/email-templates"
                className="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
              >
                Email Templates
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-900 transition text-red-400 hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

