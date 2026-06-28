# Supabase Configuration

This directory contains all Supabase-related configuration, migrations, policies, and types for ThuisZorgHub.

The database is the foundation of a multi-tenant SaaS platform serving homecare organizations.

## Structure

```
supabase/
├── migrations/           # SQL migration files (versioned by timestamp)
├── policies/             # Row Level Security (RLS) policies documentation
├── functions/            # PostgreSQL functions and Edge functions
├── seed/                 # Database seeding scripts
├── storage/              # File storage bucket configuration
└── types/                # Generated TypeScript database types
```

## Key Components

### Migrations

Database migrations using Supabase's versioned migration system.

**Current Migrations:**

- `001_create_platform_foundation.sql` - Core platform tables (organizations, branches, users, roles, permissions, audit_logs)
- `002_seed_roles_and_permissions.sql` - System roles and permission seeding

**Migration Naming Convention:**

- Format: `NNN_description.sql`
- Example: `001_create_platform_foundation.sql`
- Migrations run in order; each is idempotent when possible

### Policies (RLS)

Row Level Security policies enforce multi-tenant data isolation at the database level.

**Policy Strategy:**

- Every business table has RLS enabled
- Users can only access data from their organization
- Policies use organization_id as the isolation key
- Permissions table is globally readable (shared system resource)

**Documentation:**

- See [RLS_POLICIES.md](./policies/RLS_POLICIES.md) for detailed policy specifications
- Storage bucket policies documented in [setup_buckets.sql](./storage/setup_buckets.sql)

### Functions

PostgreSQL server functions for:

- Organization creation with owner role assignment
- Permission inheritance and role management
- Complex business logic

**Current Functions:**

- `create_organization_with_owner()` - Creates organization with pre-configured roles

### Seed Data

Initial system data:

- 30+ permissions covering all modules
- 7 system roles (Owner, Branch Manager, Scheduler, Administrator, Caregiver, Finance, Auditor)
- Permission-role assignments per role

### Storage

File storage configuration:

- `avatars` - User profile pictures
- `organization-logos` - Organization branding
- `documents` - Business documents
- `temp` - Temporary uploads

**Storage Features:**

- Organization-level isolation through RLS policies
- Size limits and access control
- CORS configuration for web uploads

## Database Schema Overview

### Platform Foundation (Migration 001)

**Core Tables:**

| Table                 | Purpose                 | Rows               | Growth |
| --------------------- | ----------------------- | ------------------ | ------ |
| organizations         | Customer organizations  | ~20                | Slow   |
| branches              | Office locations        | ~100               | Slow   |
| users                 | System users            | ~2,000             | Medium |
| roles                 | User roles              | ~7 system + custom | Slow   |
| permissions           | System permissions      | ~50+               | Slow   |
| role_permissions      | Role-permission mapping | ~300+              | Slow   |
| user_roles            | User-role assignment    | ~2,000+            | Medium |
| organization_settings | Org configuration       | ~20                | Slow   |
| audit_logs            | Change audit trail      | ~1M+               | Fast   |

### Table Relationships

```
Organization (1)
  ├─ Branches (N)
  ├─ Users (N)
  ├─ Roles (N)
  ├─ Settings (1)
  └─ Audit Logs (N)

User
  ├─ Organization (1)
  ├─ Branch (optional)
  └─ Roles (many-to-many)

Role
  ├─ Organization (1)
  ├─ Permissions (many-to-many)
  └─ Users (many-to-many)
```

### Data Flow

```
Supabase Auth
    ↓
Creates users.id matching auth.uid()
    ↓
User record created in users table
    ↓
User assigned to organization
    ↓
User assigned roles
    ↓
Roles inherit permissions
    ↓
RLS policies enforce organization access
```

## Setup Instructions

### 1. Create Supabase Project

Visit https://supabase.com and create a new project:

- Note your Project URL
- Note your Public Anon Key
- Note your Service Role Key

### 2. Configure Environment

Update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply Migrations

Using Supabase CLI:

```bash
# Initialize Supabase project locally
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations to remote
supabase db push
```

Or manually in Supabase Dashboard:

1. Go to SQL Editor
2. Create new query
3. Copy content of migration files
4. Execute in order (001, then 002)

### 4. Enable Required Extensions

These are created in migrations but ensure they exist:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 5. Verify Setup

```sql
-- Check tables exist
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'public';
-- Should be 9 tables

-- Check RLS enabled
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Should be 9 (all tables)

-- Check permissions seeded
SELECT COUNT(*) FROM permissions;
-- Should be 50+

-- Check roles created
SELECT COUNT(*) FROM roles WHERE is_system = TRUE;
-- Should be 7+ system roles
```

### 6. Generate TypeScript Types (Optional)

Using Supabase CLI:

```bash
supabase gen types typescript --project-id your-project-id > supabase/types/database.types.ts
```

Or use pre-generated types from `supabase/types/database.types.ts`

## Naming Conventions

### Tables

- Format: `snake_case`
- Example: `organization_settings`
- Multi-word: `user_roles`, `role_permissions`

### Columns

- Format: `snake_case`
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Foreign keys: `{table_singular}_id` (e.g., `organization_id`, `user_id`)
- Boolean: `is_active`, `is_deleted`, `is_system`
- Soft delete: Include `is_deleted` and `deleted_at`

### Primary Keys

- Type: UUID
- Default: `gen_random_uuid()`
- Field name: `id`

### Indexes

Performance indexes on:

- Foreign keys (automatic for constraints)
- `organization_id` (multi-tenant isolation)
- `email` (user lookups)
- `created_at` (time-based queries)
- `is_deleted` (soft delete filters)

## Multi-Tenancy Design

**Core Principle:** Every business table contains `organization_id`

**Enforcement:**

1. **Database Layer** - RLS policies on all tables
2. **Application Layer** - Always filter by organization_id
3. **API Layer** - Extract organization_id from JWT
4. **Audit Layer** - Record organization context

**Example Query:**

```sql
-- User from Organization A
SELECT * FROM users WHERE organization_id = user's_organization_id;
-- Returns only users from Organization A

-- User from Organization B
SELECT * FROM users WHERE organization_id = user's_organization_id;
-- Returns only users from Organization B
```

## Row Level Security

All tables have RLS policies. See [RLS_POLICIES.md](./policies/RLS_POLICIES.md) for complete specifications.

**Policy Pattern:**

```sql
CREATE POLICY "{policy_name}" ON {table_name}
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );
```

**Key Points:**

- RLS uses `auth.uid()` to get authenticated user ID
- User ID must match Supabase Auth UID
- Policies automatically enforced at query level
- Cannot be bypassed from client SDK

## Soft Delete Strategy

Deleted records are never permanently removed:

```sql
-- Soft delete
UPDATE users SET is_deleted = TRUE, deleted_at = NOW()
WHERE id = 'user-uuid';

-- Restore
UPDATE users SET is_deleted = FALSE, deleted_at = NULL
WHERE id = 'user-uuid';

-- Query active records only
SELECT * FROM users WHERE is_deleted = FALSE;
```

**Benefits:**

- Full audit trail
- Easy recovery
- GDPR compliance (export before delete)
- No foreign key issues

## Audit Logging

Every important action creates an audit log:

```sql
INSERT INTO audit_logs (
  organization_id, user_id, event_type, resource_type,
  resource_id, action, changes, status
) VALUES (
  'org-uuid', 'user-uuid', 'user_created', 'user',
  'new-user-uuid', 'create', '{}', 'success'
);
```

**Queryable by:**

- Organization ID
- User ID
- Resource type and ID
- Event type
- Time range

**Immutability:**

- Audit logs cannot be edited
- Consider archival for old entries
- RLS enforces organization access

## Storage Buckets

Four buckets configured with RLS:

| Bucket             | Purpose               | Access        | Size Limit |
| ------------------ | --------------------- | ------------- | ---------- |
| avatars            | User profile pictures | Own file only | 5 MB       |
| organization-logos | Org branding          | Org members   | 10 MB      |
| documents          | Business docs         | Org members   | 100 MB     |
| temp               | Temporary uploads     | Own files     | 50 MB      |

See [setup_buckets.sql](./storage/setup_buckets.sql) for RLS policies.

## Permissions Reference

### Modules

- organization, branch, user, role, permission
- employee, client, schedule, visit, document
- report, audit, settings, billing, notification, dashboard

### Actions

- view, create, update, delete
- manage, assign, upload, download, export, send, complete

### Example Permissions

```
organization.view        # View organization
organization.manage      # Manage organization
user.invite              # Invite users
schedule.assign          # Assign shifts
visit.complete           # Complete visits
report.export            # Export reports
billing.manage           # Manage subscriptions
```

## System Roles

Seven pre-configured roles created with each organization:

1. **Organization Owner** - Full access to everything
2. **Branch Manager** - Branch-level operations
3. **Scheduler** - Schedule and visit management
4. **Administrator** - Office administration
5. **Caregiver** - Field staff (limited access)
6. **Finance** - Billing and payments
7. **Auditor** - Read-only audit access

Each role is pre-assigned appropriate permissions.

## Performance Optimization

### Indexes

```sql
-- Check missing indexes
SELECT * FROM pg_stat_user_indexes;

-- Add custom index
CREATE INDEX idx_users_organization_id_active
ON users(organization_id) WHERE is_deleted = FALSE;
```

### Query Optimization

```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM users WHERE organization_id = 'org-uuid' AND is_active = TRUE;

-- Should use organization_id index
```

### Connection Pooling

For serverless environments, use connection pooling:

```bash
# Update .env.local
SUPABASE_DB_URL=postgresql://...?schema=auth
```

## Best Practices

1. **Always include timestamps** - Every record tracks creation and updates
2. **Use soft deletes** - Enable audit trails and recovery
3. **Index foreign keys** - Improves join performance
4. **Define constraints early** - Enforce data integrity
5. **Test RLS policies** - Verify isolation works
6. **Document complex logic** - Explain non-obvious SQL
7. **Keep migrations reversible** - Allow rollback if needed
8. **Monitor audit logs** - Track sensitive changes
9. **Filter by organization_id** - Always in application queries
10. **Use prepared statements** - Prevent SQL injection

## Troubleshooting

### Users See No Data

**Symptom:** User can authenticate but queries return empty
**Cause:** User record missing or organization_id mismatch
**Solution:**

```sql
-- Verify user exists
SELECT * FROM users WHERE id = 'user-uuid';

-- Verify organization exists
SELECT * FROM organizations WHERE id = 'org-uuid';

-- Check organization_id matches
SELECT * FROM users WHERE id = 'user-uuid' AND organization_id = 'org-uuid';
```

### Slow Queries

**Symptom:** Queries taking >1 second
**Cause:** Missing indexes or complex RLS policies
**Solution:**

```sql
-- Check if using indexes
EXPLAIN ANALYZE SELECT * FROM users WHERE organization_id = 'org-uuid';

-- Add missing index if needed
CREATE INDEX idx_users_org_active ON users(organization_id, is_active);
```

### Permission Denied

**Symptom:** RLS policy prevents legitimate access
**Cause:** Policy incorrectly blocking user or user not in organization
**Solution:**

1. Verify RLS policy logic in [RLS_POLICIES.md](./policies/RLS_POLICIES.md)
2. Check user organization assignment: `SELECT * FROM users WHERE id = auth.uid();`
3. Review policy with security team

### Migration Failures

**Symptom:** Migration fails with constraint or syntax error
**Cause:** Database state mismatch or SQL error
**Solution:**

1. Check error message carefully
2. Verify no manual changes to schema
3. Review migration SQL syntax
4. Contact Supabase support if needed

## Related Documentation

- [Master Software Specification](../docs/ThuisZorgHub%20-%20Master%20Software%20Specification%20v1.0.md) - Section 7 (Database Design)
- [Architecture Guide](../ARCHITECTURE.md) - Multi-tenant implementation
- [RLS Policies](./policies/RLS_POLICIES.md) - Detailed policy specifications
- [Storage Setup](./storage/setup_buckets.sql) - Bucket configuration
