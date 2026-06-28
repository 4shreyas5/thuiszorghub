# Sprint 01 — Foundation

## Objective

Sprint 01 establishes the technical foundation of ThuisZorgHub.

At the end of this sprint, the platform will support secure authentication, organization creation, branch management, user management, role-based access control, and a production-ready database foundation.

No business modules (Clients, Employees, Scheduling, etc.) will be developed until this sprint is complete.

---

# Sprint Goal

Deliver a secure, scalable, multi-tenant platform capable of supporting multiple homecare organizations.

---

# Scope

The following modules are included:

- Authentication
- Organizations
- Branches
- Users
- Roles
- Permissions
- Organization Settings
- Audit Logs
- Dashboard Skeleton
- Navigation Skeleton

---

# Deliverables

By the end of Sprint 01, the following shall exist:

✓ Login Page

✓ Forgot Password

✓ Reset Password

✓ Invite User

✓ Organization Creation

✓ Branch Creation

✓ User Creation

✓ User Invitation

✓ Role Assignment

✓ Permission Assignment

✓ Sidebar Navigation

✓ Dashboard Layout

✓ Organization Settings

✓ Audit Logging

✓ Multi-language Support (EN/NL)

✓ Row Level Security

✓ Database Migrations

✓ Seed Data

---

# Database Tables

organizations

branches

users

roles

permissions

role_permissions

user_roles

organization_settings

audit_logs

translations

---

# Pages

Authentication

Login

Forgot Password

Reset Password

Invite User

Dashboard

Organizations

Organization Details

Branches

Users

Roles

Permissions

Settings

Profile

---

# APIs

Authentication APIs

Organization APIs

Branch APIs

User APIs

Role APIs

Permission APIs

Settings APIs

Audit APIs

---

# Acceptance Criteria

Users can securely log in.

Organizations are isolated.

Users only see authorized information.

Role permissions function correctly.

Audit logs record every sensitive action.

Application supports English and Dutch.

The system is ready for Employee and Client modules.

---

# Exit Criteria

Sprint 01 is complete only when:

All authentication flows work.

All permissions are enforced.

Organization isolation is verified.

Dashboard loads successfully.

Sidebar navigation functions correctly.

All critical test cases pass.

The platform is ready to begin Sprint 02.
