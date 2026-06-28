# Supabase Quick Reference

Quick lookup guide for developers working with ThuisZorgHub database.

---

## Essential Commands

### Connect to Supabase

```bash
# Initialize project
supabase init

# Link to project
supabase link --project-ref {project-ref}

# View current status
supabase status
```

### Manage Migrations

```bash
# Push all migrations
supabase db push

# Pull remote changes
supabase db pull

# Create new migration
supabase migration new {description}
```

### Generate Types

```bash
# Generate TypeScript types
supabase gen types typescript --project-id {project-id} > supabase/types/database.types.ts

# In your app
import type { Database } from '@/supabase/types/database.types'
type Users = Database['public']['Tables']['users']['Row']
```

---

## Common Queries

### Create Organization with Owner

```typescript
const { data, error } = await supabase.rpc("create_organization_with_owner", {
  p_organization_name: "ABC Homecare",
  p_organization_email: "info@abc.nl",
  p_user_id: user.id,
  p_first_name: "John",
  p_last_name: "Doe",
  p_language: "nl",
  p_timezone: "Europe/Amsterdam",
});
```

### Get User with Roles and Permissions

```typescript
const { data: user } = await supabase
  .from("users")
  .select(
    `
    *,
    user_roles(
      role:roles(
        *,
        role_permissions(
          permission:permissions(*)
        )
      )
    )
  `
  )
  .eq("id", userId)
  .single();
```

### Get All Organization Users

```typescript
const { data: users } = await supabase
  .from("users")
  .select("*")
  .eq("organization_id", orgId)
  .eq("is_deleted", false)
  .order("created_at", { ascending: false });
```

### Get Organization Branches

```typescript
const { data: branches } = await supabase
  .from("branches")
  .select(
    `
    *,
    manager:manager_user_id(first_name, last_name, email)
  `
  )
  .eq("organization_id", orgId)
  .eq("is_deleted", false);
```

### Assign Role to User

```typescript
const { data, error } = await supabase.from("user_roles").insert({
  user_id: userId,
  role_id: roleId,
  assigned_by: currentUserId,
});
```

### Create Audit Log

```typescript
const { data, error } = await supabase.from("audit_logs").insert({
  organization_id: orgId,
  user_id: userId,
  event_type: "user_created",
  resource_type: "user",
  resource_id: newUserId,
  action: "create",
  changes: { email: "user@example.com", name: "John Doe" },
  status: "success",
});
```

### Soft Delete User

```typescript
const { data, error } = await supabase
  .from("users")
  .update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
  })
  .eq("id", userId)
  .eq("organization_id", orgId);
```

### Query with Organization Isolation

```typescript
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("organization_id", orgId) // ALWAYS filter by org
  .eq("is_active", true) // Filter active only
  .is("deleted_at", null); // Exclude soft-deleted
```

---

## Table Quick Reference

### organizations

```
View all: SELECT * FROM organizations WHERE is_active = true
Find: SELECT * FROM organizations WHERE email = 'org@example.com'
Fields: id, name, email, timezone, currency, primary_language
Unique: email, kvk_number
```

### branches

```
View org branches: SELECT * FROM branches WHERE organization_id = $1 AND is_deleted = false
Find: SELECT * FROM branches WHERE code = $1 AND organization_id = $2
Fields: id, organization_id, name, code, manager_user_id
FK: organization_id, manager_user_id
```

### users

```
View org users: SELECT * FROM users WHERE organization_id = $1 AND is_deleted = false
Find: SELECT * FROM users WHERE email = $1 AND organization_id = $2
Fields: id, organization_id, branch_id, first_name, last_name, email
Unique: (organization_id, email)
```

### roles

```
View org roles: SELECT * FROM roles WHERE organization_id = $1
Find: SELECT * FROM roles WHERE name = $1 AND organization_id = $2
Fields: id, organization_id, name, description, is_system
Unique: (organization_id, name)
```

### permissions

```
View all: SELECT * FROM permissions
Find: SELECT * FROM permissions WHERE code = $1
Fields: id, module, action, code, description
Format: module.action (e.g., user.create)
```

### user_roles

```
View user's roles: SELECT * FROM user_roles WHERE user_id = $1
Find: SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2
Fields: id, user_id, role_id, assigned_by, assigned_at
```

### role_permissions

```
View role perms: SELECT * FROM role_permissions WHERE role_id = $1
Find: SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2
Fields: id, role_id, permission_id
```

### organization_settings

```
View: SELECT * FROM organization_settings WHERE organization_id = $1
Fields: id, date_format, time_format, currency, timezone, language
```

### audit_logs

```
View org logs: SELECT * FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100
Find: SELECT * FROM audit_logs WHERE resource_type = $1 AND resource_id = $2
Fields: id, organization_id, user_id, event_type, resource_type, action, status
Query by: event_type, resource_type, created_at
```

---

## Permissions Reference

### Organization

```
organization.view      - See organization
organization.create    - Create organization (Super Admin)
organization.update    - Edit organization
organization.delete    - Delete organization (Super Admin)
organization.manage    - Full organization management
```

### User Management

```
user.view              - View users
user.create            - Create user
user.update            - Edit user
user.delete            - Delete user
user.invite            - Send user invite
user.manage            - Full user management
```

### Role Management

```
role.view              - View roles
role.create            - Create role
role.update            - Edit role
role.delete            - Delete role
role.manage            - Full role management
```

### Branches

```
branch.view            - View branches
branch.create          - Create branch
branch.update          - Edit branch
branch.delete          - Delete branch
branch.manage          - Full branch management
```

### Employees

```
employee.view          - View employees
employee.create        - Create employee
employee.update        - Edit employee
employee.delete        - Delete employee
employee.manage        - Full employee management
```

### Clients

```
client.view            - View clients
client.create          - Create client
client.update          - Edit client
client.delete          - Delete client
client.manage          - Full client management
```

### Scheduling

```
schedule.view          - View schedules
schedule.create        - Create schedule
schedule.update        - Edit schedule
schedule.delete        - Delete schedule
schedule.assign        - Assign staff
```

### Visits

```
visit.view             - View visits
visit.create           - Create visit
visit.update           - Edit visit
visit.delete           - Delete visit
visit.complete         - Mark complete
visit.manage           - Full visit management
```

### Documents

```
document.view          - View documents
document.create        - Create entry
document.upload        - Upload file
document.download      - Download file
document.delete        - Delete document
```

### Reports & Analytics

```
report.view            - View reports
report.export          - Export data
report.manage          - Full report access
```

### Audit & Compliance

```
audit.view             - View audit logs
audit.manage           - Full audit access
```

### Settings

```
settings.view          - View settings
settings.update        - Change settings
settings.manage        - Full settings access
```

### Billing

```
billing.view           - View billing
billing.manage         - Manage billing
billing.export         - Export financial data
```

### Dashboard

```
dashboard.view         - Access dashboard
```

### Notifications

```
notification.view      - View notifications
notification.send      - Send notification
notification.manage    - Full notification access
```

---

## RLS Policy Quick Reference

### Check User's Organization

```sql
-- This is what RLS checks:
SELECT organization_id FROM users WHERE id = auth.uid()

-- User can only see data from their org:
organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
)
```

### Bypass RLS (Service Role Only)

```typescript
// Use service role for server-side operations
const { data } = await supabase.from("users").select("*").using("supabase_service_role_key"); // Server-side only
```

### Testing RLS

```sql
-- Test as authenticated user
SELECT * FROM users;  -- Should return users from their org

-- Test as different user
-- Change auth.uid() context and query again

-- Test as anonymous
-- Should return permission denied error
```

---

## Performance Tips

### Use Indexes

```sql
-- Check if query uses index
EXPLAIN ANALYZE SELECT * FROM users WHERE organization_id = 'org-id';

-- Add index if needed
CREATE INDEX idx_users_org_active ON users(organization_id, is_active);
```

### Pagination

```typescript
const pageSize = 20;
const page = 0;

const { data } = await supabase
  .from("users")
  .select("*", { count: "exact" })
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order("created_at", { ascending: false });
```

### Soft Delete Patterns

```typescript
// Query active records
.eq('is_deleted', false)

// Restore deleted record
.update({ is_deleted: false, deleted_at: null })

// Soft delete
.update({ is_deleted: true, deleted_at: new Date() })
```

### Count Records

```typescript
const { count } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .eq("organization_id", orgId);
```

---

## Common Mistakes to Avoid

### ❌ Don't forget organization_id filter

```typescript
// Wrong - could see other organizations!
const { data } = await supabase.from("users").select("*");

// Right - always filter
const { data } = await supabase.from("users").select("*").eq("organization_id", orgId);
```

### ❌ Don't query deleted records

```typescript
// Wrong - includes soft-deleted records
const { data } = await supabase.from("users").select("*");

// Right - exclude deleted
const { data } = await supabase.from("users").select("*").eq("is_deleted", false);
```

### ❌ Don't update without where clause

```typescript
// Wrong - updates all records!
await supabase.from("users").update({ is_active: false });

// Right - target specific record
await supabase
  .from("users")
  .update({ is_active: false })
  .eq("id", userId)
  .eq("organization_id", orgId);
```

### ❌ Don't use hardcoded UUIDs

```typescript
// Wrong - UUID varies per environment
const orgId = "550e8400-e29b-41d4-a716-446655440000";

// Right - get from current user context
const orgId = user?.organization_id;
```

### ❌ Don't expose service role key to client

```typescript
// Wrong - exposes key to client
const supabase = createClient(url, SUPABASE_SERVICE_ROLE_KEY);

// Right - use anon key client-side
const supabase = createClient(url, NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

---

## Debugging

### Enable SQL Logging

```typescript
const supabase = createClient(url, key, {
  db: { schema: "public" },
  auth: { autoRefreshToken: true, persistSession: true },
});

// Check query in Network tab or logs
```

### View RLS Policy

```sql
-- Check policies on table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- View policy SQL
SELECT pg_get_expr(qual, relid) FROM pg_policies WHERE tablename = 'users';
```

### Test Connection

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Connected as:", user?.email);
```

### Check User Organization

```typescript
const { data } = await supabase.from("users").select("organization_id").eq("id", user.id).single();

console.log("Organization:", data?.organization_id);
```

---

## Related Documentation

- [Complete README](./README.md) - Full documentation
- [Schema Overview](./SCHEMA_OVERVIEW.md) - Detailed schema
- [RLS Policies](./policies/RLS_POLICIES.md) - Security policies
- [Master Specification](../docs/ThuisZorgHub%20-%20Master%20Software%20Specification%20v1.0.md) - Requirements
