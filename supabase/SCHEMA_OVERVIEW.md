# Database Schema Overview

Complete specification of the ThuisZorgHub database structure as of Migration 001.

---

## Table of Contents

1. [Core Entities](#core-entities)
2. [Complete Schema](#complete-schema)
3. [Relationships](#relationships)
4. [Constraints](#constraints)
5. [Indexes](#indexes)
6. [Growth Projections](#growth-projections)

---

## Core Entities

### 1. organizations

**Purpose:** Represents a customer organization (homecare agency)

**Columns:**

- `id` (UUID, PK) - Organization identifier
- `name` (VARCHAR 150, NOT NULL) - Organization name
- `legal_name` (VARCHAR 200) - Registered legal entity
- `kvk_number` (VARCHAR 30, UNIQUE) - Dutch Chamber of Commerce
- `vat_number` (VARCHAR 50) - VAT/Tax number
- `email` (VARCHAR 255, NOT NULL, UNIQUE) - Primary contact email
- `phone` (VARCHAR 30) - Contact number
- `website` (VARCHAR 255) - Company website
- `address_line_1` (VARCHAR 255, NOT NULL) - Street address
- `address_line_2` (VARCHAR 255) - Additional address
- `city` (VARCHAR 100, NOT NULL) - City
- `postal_code` (VARCHAR 20, NOT NULL) - Postal code
- `country` (VARCHAR 100, NOT NULL, DEFAULT 'Netherlands') - Country
- `logo_url` (TEXT) - Organization logo URL
- `primary_language` (VARCHAR 10, NOT NULL, DEFAULT 'nl') - Default language
- `timezone` (VARCHAR 100, NOT NULL, DEFAULT 'Europe/Amsterdam') - Timezone
- `currency` (VARCHAR 10, NOT NULL, DEFAULT 'EUR') - Currency code
- `subscription_id` (UUID) - Active subscription
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE) - Active status
- `is_deleted` (BOOLEAN, NOT NULL, DEFAULT FALSE) - Soft delete flag
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Last update
- `deleted_at` (TIMESTAMP WITH TIME ZONE) - Soft delete timestamp

**Indexes:**

- PK: `id`
- Unique: `email`, `kvk_number`
- Regular: `name`, `created_at`

**Constraints:**

- Email must be unique
- KVK number must be unique
- Country must be valid ISO code

**Growth:** ~20 organizations, slow growth

---

### 2. branches

**Purpose:** Physical office locations within an organization

**Columns:**

- `id` (UUID, PK) - Branch identifier
- `organization_id` (UUID, FK) - Parent organization
- `name` (VARCHAR 150, NOT NULL) - Branch name
- `code` (VARCHAR 20) - Internal branch code
- `manager_user_id` (UUID, FK) - Assigned branch manager
- `email` (VARCHAR 255) - Branch email
- `phone` (VARCHAR 30) - Contact number
- `address_line_1` (VARCHAR 255, NOT NULL) - Street address
- `address_line_2` (VARCHAR 255) - Additional address
- `city` (VARCHAR 100, NOT NULL) - City
- `postal_code` (VARCHAR 20, NOT NULL) - Postal code
- `country` (VARCHAR 100, NOT NULL, DEFAULT 'Netherlands') - Country
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE) - Active status
- `is_deleted` (BOOLEAN, NOT NULL, DEFAULT FALSE) - Soft delete flag
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Last update
- `deleted_at` (TIMESTAMP WITH TIME ZONE) - Soft delete timestamp

**Indexes:**

- PK: `id`
- FK: `organization_id`, `manager_user_id`

**Foreign Keys:**

- `organization_id` → `organizations.id` (CASCADE)
- `manager_user_id` → `users.id` (SET NULL)

**Growth:** ~100 branches, slow growth

---

### 3. users

**Purpose:** Platform users who can authenticate and access ThuisZorgHub

**Columns:**

- `id` (UUID, PK) - User ID (matches Supabase Auth UID)
- `organization_id` (UUID, FK, NOT NULL) - Organization membership
- `branch_id` (UUID, FK) - Default/assigned branch
- `employee_id` (UUID, FK) - Linked employee record
- `first_name` (VARCHAR 100, NOT NULL) - First name
- `last_name` (VARCHAR 100, NOT NULL) - Last name
- `email` (VARCHAR 255, NOT NULL) - Login email
- `phone` (VARCHAR 30) - Mobile number
- `avatar_url` (TEXT) - Profile picture URL
- `language` (VARCHAR 10, NOT NULL, DEFAULT 'nl') - UI language preference
- `timezone` (VARCHAR 100, NOT NULL, DEFAULT 'Europe/Amsterdam') - Timezone
- `last_login` (TIMESTAMP WITH TIME ZONE) - Last login timestamp
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE) - Active status
- `is_deleted` (BOOLEAN, NOT NULL, DEFAULT FALSE) - Soft delete flag
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Last update
- `deleted_at` (TIMESTAMP WITH TIME ZONE) - Soft delete timestamp

**Indexes:**

- PK: `id`
- FK: `organization_id`, `branch_id`, `employee_id`
- Unique: `(organization_id, email)` - Email unique per organization
- Regular: `email`, `created_at`, `is_active`

**Foreign Keys:**

- `organization_id` → `organizations.id` (CASCADE)
- `branch_id` → `branches.id` (SET NULL)
- `employee_id` → `employees.id` (SET NULL) - Future table

**Constraints:**

- Email must be unique per organization
- User must belong to organization

**Growth:** ~2,000+ users, medium growth

---

### 4. roles

**Purpose:** User roles within an organization

**Columns:**

- `id` (UUID, PK) - Role identifier
- `organization_id` (UUID, FK, NOT NULL) - Organization
- `name` (VARCHAR 100, NOT NULL) - Role name
- `description` (TEXT) - Role description
- `is_system` (BOOLEAN, NOT NULL, DEFAULT FALSE) - Built-in system role
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Last update

**Indexes:**

- PK: `id`
- FK: `organization_id`
- Unique: `(organization_id, name)` - Role name unique per organization

**Foreign Keys:**

- `organization_id` → `organizations.id` (CASCADE)

**Constraints:**

- Role name must be unique per organization
- System roles cannot be deleted (application level)

**System Roles (per organization):**

1. Organization Owner
2. Branch Manager
3. Scheduler
4. Administrator
5. Caregiver
6. Finance
7. Auditor

**Growth:** ~7-15 roles per organization, slow growth

---

### 5. permissions

**Purpose:** System permissions (global, not organization-specific)

**Columns:**

- `id` (UUID, PK) - Permission identifier
- `module` (VARCHAR 100, NOT NULL) - Feature module
- `action` (VARCHAR 100, NOT NULL) - Action type
- `code` (VARCHAR 150, NOT NULL, UNIQUE) - Permission code
- `description` (TEXT) - Description
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time

**Indexes:**

- PK: `id`
- Unique: `code`

**Constraints:**

- Permission code must be globally unique
- Code format: `module.action`

**Total Permissions:** 50+ system permissions across all modules

**Permission Structure:**

```
organization.view, organization.create, organization.update, organization.delete, organization.manage
branch.view, branch.create, branch.update, branch.delete, branch.manage
user.view, user.create, user.update, user.delete, user.invite, user.manage
role.view, role.create, role.update, role.delete, role.manage
permission.view, permission.manage
employee.view, employee.create, employee.update, employee.delete, employee.manage
client.view, client.create, client.update, client.delete, client.manage
schedule.view, schedule.create, schedule.update, schedule.delete, schedule.assign
visit.view, visit.create, visit.update, visit.delete, visit.complete, visit.manage
document.view, document.create, document.update, document.delete, document.upload, document.download
report.view, report.export, report.manage
audit.view, audit.manage
settings.view, settings.update, settings.manage
billing.view, billing.manage, billing.export
notification.view, notification.send, notification.manage
dashboard.view
```

**Growth:** ~50 permissions, no growth

---

### 6. role_permissions

**Purpose:** Maps roles to permissions (many-to-many)

**Columns:**

- `id` (UUID, PK) - Record identifier
- `role_id` (UUID, FK, NOT NULL) - Role
- `permission_id` (UUID, FK, NOT NULL) - Permission
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time

**Indexes:**

- PK: `id`
- FK: `role_id`, `permission_id`
- Unique: `(role_id, permission_id)` - No duplicate assignments

**Foreign Keys:**

- `role_id` → `roles.id` (CASCADE)
- `permission_id` → `permissions.id` (CASCADE)

**Constraints:**

- Each permission assigned to each role only once
- Cannot delete permission if assigned to active roles (application level)

**Typical Density:** 20-35 permissions per role

**Growth:** ~300+ mappings, slow growth

---

### 7. user_roles

**Purpose:** Maps users to roles (many-to-many)

**Columns:**

- `id` (UUID, PK) - Record identifier
- `user_id` (UUID, FK, NOT NULL) - User
- `role_id` (UUID, FK, NOT NULL) - Role
- `assigned_by` (UUID, FK, NOT NULL) - User who made assignment
- `assigned_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Assignment time

**Indexes:**

- PK: `id`
- FK: `user_id`, `role_id`, `assigned_by`
- Unique: `(user_id, role_id)` - No duplicate assignments

**Foreign Keys:**

- `user_id` → `users.id` (CASCADE)
- `role_id` → `roles.id` (CASCADE)
- `assigned_by` → `users.id` (RESTRICT) - Prevent orphaned audit trail

**Constraints:**

- User can be assigned same role only once
- Assignment must be performed by authorized user

**Typical Density:** 1-3 roles per user

**Growth:** ~2,000+ mappings, medium growth

---

### 8. organization_settings

**Purpose:** Organization-specific configuration

**Columns:**

- `id` (UUID, PK) - Settings identifier
- `organization_id` (UUID, FK, UNIQUE, NOT NULL) - Organization
- `date_format` (VARCHAR 20, NOT NULL, DEFAULT 'DD-MM-YYYY') - Date format
- `time_format` (VARCHAR 5, NOT NULL, DEFAULT '24h') - Time format (12h/24h)
- `currency` (VARCHAR 10, NOT NULL, DEFAULT 'EUR') - Currency code
- `work_week_start` (INTEGER, NOT NULL, DEFAULT 1) - Week start day (0=Sunday, 1=Monday)
- `default_visit_duration` (INTEGER, NOT NULL, DEFAULT 60) - Default visit length in minutes
- `timezone` (VARCHAR 100, NOT NULL, DEFAULT 'Europe/Amsterdam') - Timezone
- `language` (VARCHAR 10, NOT NULL, DEFAULT 'nl') - Default language
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Creation time
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Last update

**Indexes:**

- PK: `id`
- FK: `organization_id` (UNIQUE)

**Foreign Keys:**

- `organization_id` → `organizations.id` (CASCADE)

**Constraints:**

- One settings record per organization
- Default visit duration: 15-480 minutes

**Growth:** ~20 records (one per organization)

---

### 9. audit_logs

**Purpose:** Immutable record of all important actions

**Columns:**

- `id` (UUID, PK) - Log entry identifier
- `organization_id` (UUID, FK, NOT NULL) - Organization context
- `user_id` (UUID, FK) - Acting user
- `event_type` (VARCHAR 100, NOT NULL) - Type of event
- `resource_type` (VARCHAR 100, NOT NULL) - Resource affected (user, client, etc.)
- `resource_id` (UUID) - ID of affected resource
- `action` (VARCHAR 50, NOT NULL) - Action performed (create, update, delete)
- `changes` (JSONB) - Changed fields and old/new values
- `ip_address` (VARCHAR 45) - Request IP address
- `user_agent` (TEXT) - Browser/client info
- `status` (VARCHAR 20, NOT NULL, DEFAULT 'success') - Outcome (success/failure)
- `error_message` (TEXT) - Error details if failed
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()) - Entry time

**Indexes:**

- PK: `id`
- FK: `organization_id`, `user_id`
- Regular: `(resource_type, resource_id)`, `created_at`, `event_type`

**Foreign Keys:**

- `organization_id` → `organizations.id` (CASCADE)
- `user_id` → `users.id` (SET NULL)

**Constraints:**

- Immutable (no updates/deletes from application)
- Status must be: success, failure, partial

**Event Types (Examples):**

```
user_created, user_updated, user_deleted, user_invited, user_logged_in
organization_created, organization_updated, organization_suspended
branch_created, branch_updated, branch_deleted
role_created, role_updated, role_deleted
visit_created, visit_completed, visit_cancelled
document_uploaded, document_deleted
schedule_created, schedule_changed
```

**Retention:** Indefinite (or per compliance policy)

**Growth:** ~1M+ entries, fast growth, consider partitioning by created_at

---

## Complete Schema

### Table Summary

| Table                 | Type     | Rows | Soft Delete | RLS | Audit |
| --------------------- | -------- | ---- | ----------- | --- | ----- |
| organizations         | Core     | 20   | Yes         | Yes | Yes   |
| branches              | Core     | 100  | Yes         | Yes | Yes   |
| users                 | Core     | 2K+  | Yes         | Yes | Yes   |
| roles                 | Core     | 100  | No          | Yes | Yes   |
| permissions           | Shared   | 50   | No          | Yes | No    |
| role_permissions      | Junction | 300+ | No          | Yes | No    |
| user_roles            | Junction | 2K+  | No          | Yes | No    |
| organization_settings | Config   | 20   | No          | Yes | Yes   |
| audit_logs            | Audit    | 1M+  | No          | Yes | No    |

---

## Relationships

### Organization → Branches

- Type: One-to-Many
- FK: `branches.organization_id` → `organizations.id`
- Cascade: DELETE CASCADE
- Constraint: Every branch belongs to exactly one organization

### Organization → Users

- Type: One-to-Many
- FK: `users.organization_id` → `organizations.id`
- Cascade: DELETE CASCADE
- Constraint: Every user belongs to exactly one organization

### Organization → Roles

- Type: One-to-Many
- FK: `roles.organization_id` → `organizations.id`
- Cascade: DELETE CASCADE
- Constraint: Every role belongs to one organization

### Organization → Settings

- Type: One-to-One
- FK: `organization_settings.organization_id` → `organizations.id` (UNIQUE)
- Cascade: DELETE CASCADE
- Constraint: Every organization has exactly one settings record

### Organization → Audit Logs

- Type: One-to-Many
- FK: `audit_logs.organization_id` → `organizations.id`
- Cascade: DELETE CASCADE
- Constraint: Every audit log belongs to one organization

### Branch → Users

- Type: One-to-Many (optional)
- FK: `users.branch_id` → `branches.id`
- Cascade: SET NULL
- Constraint: User may optionally be assigned to a branch

### Branch → Branch Manager

- Type: One-to-Many (optional)
- FK: `branches.manager_user_id` → `users.id`
- Cascade: SET NULL
- Constraint: Branch may have an assigned manager

### User → Roles

- Type: Many-to-Many
- Junction: `user_roles`
- Constraint: User can have multiple roles; role can have multiple users

### Role → Permissions

- Type: Many-to-Many
- Junction: `role_permissions`
- Constraint: Role can have multiple permissions; permission assigned to multiple roles

---

## Constraints

### Primary Keys

All tables use UUID primary keys with default `gen_random_uuid()`:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Keys

All foreign keys use ON DELETE CASCADE or SET NULL:

```sql
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
branch_id UUID REFERENCES branches(id) ON DELETE SET NULL
```

### Unique Constraints

Enforced uniqueness:

| Constraint                                 | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `organizations(email)`                     | Organization email                |
| `organizations(kvk_number)`                | Dutch business number             |
| `users(organization_id, email)`            | Email unique per organization     |
| `roles(organization_id, name)`             | Role name unique per organization |
| `permissions(code)`                        | Global permission code            |
| `role_permissions(role_id, permission_id)` | No duplicate assignments          |
| `user_roles(user_id, role_id)`             | No duplicate assignments          |
| `organization_settings(organization_id)`   | One settings per organization     |

### Check Constraints

Possible future constraints:

```sql
-- Visit duration in valid range
ALTER TABLE organization_settings ADD CONSTRAINT check_visit_duration
CHECK (default_visit_duration >= 15 AND default_visit_duration <= 480);

-- Work week start valid day
ALTER TABLE organization_settings ADD CONSTRAINT check_work_week
CHECK (work_week_start >= 0 AND work_week_start <= 6);
```

---

## Indexes

### Primary Indexes

Every table has implicit index on PK:

```sql
INDEX id (BTREE)
```

### Foreign Key Indexes

Automatic indexes on all FKs:

```sql
INDEX organizations_id (BTREE)
INDEX branches_organization_id (BTREE)
INDEX branches_manager_user_id (BTREE)
INDEX users_organization_id (BTREE)
INDEX users_branch_id (BTREE)
INDEX users_employee_id (BTREE)
INDEX roles_organization_id (BTREE)
INDEX role_permissions_role_id (BTREE)
INDEX role_permissions_permission_id (BTREE)
INDEX user_roles_user_id (BTREE)
INDEX user_roles_role_id (BTREE)
INDEX user_roles_assigned_by (BTREE)
INDEX audit_logs_organization_id (BTREE)
INDEX audit_logs_user_id (BTREE)
```

### Performance Indexes

Additional indexes for query performance:

```sql
-- User lookups
INDEX users_email (BTREE)

-- Audit queries
INDEX audit_logs_resource_type_id (BTREE) ON (resource_type, resource_id)
INDEX audit_logs_created_at (BTREE)
INDEX audit_logs_event_type (BTREE)

-- Soft delete filtering
INDEX organizations_is_deleted (BTREE) WHERE is_deleted = FALSE
INDEX branches_is_deleted (BTREE) WHERE is_deleted = FALSE
INDEX users_is_deleted (BTREE) WHERE is_deleted = FALSE
```

---

## Growth Projections

### Storage Estimation

Based on ~20 organizations with ~2,000 users:

| Table                 | Rows      | Avg Row Size | Total Size  |
| --------------------- | --------- | ------------ | ----------- |
| organizations         | 20        | 800 B        | 16 KB       |
| branches              | 100       | 400 B        | 40 KB       |
| users                 | 2,000     | 500 B        | 1 MB        |
| roles                 | 150       | 200 B        | 30 KB       |
| permissions           | 50        | 300 B        | 15 KB       |
| role_permissions      | 300       | 100 B        | 30 KB       |
| user_roles            | 2,000     | 100 B        | 200 KB      |
| organization_settings | 20        | 300 B        | 6 KB        |
| audit_logs            | 1,000,000 | 1 KB         | 1 GB        |
| **Total**             |           |              | **~1.2 GB** |

### Growth Rate (12 months)

| Table         | Current | After 12 mo | Annual Growth |
| ------------- | ------- | ----------- | ------------- |
| organizations | 20      | 50+         | 150%          |
| users         | 2,000   | 5,000+      | 150%          |
| audit_logs    | 1M      | 5M+         | 400%          |

### Scalability Plan

**Phase 1 (Current):** Single database, all tables together

**Phase 2 (1M+ audit logs):** Partition audit_logs by created_at (monthly)

**Phase 3 (10M+ records):** Read replicas for reporting queries

**Phase 4 (100M+ records):** Archive old audit logs to cold storage

---

## Related Documentation

- [Master Software Specification](../docs/ThuisZorgHub%20-%20Master%20Software%20Specification%20v1.0.md) - Section 7-8
- [RLS Policies](./policies/RLS_POLICIES.md) - Access control
- [Migration Strategy](./migrations/001_create_platform_foundation.sql) - Implementation
