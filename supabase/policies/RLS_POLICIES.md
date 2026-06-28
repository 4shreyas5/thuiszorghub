# Row Level Security (RLS) Policies

## Overview

ThuisZorgHub implements Row Level Security (RLS) at the database level to enforce multi-tenant data isolation. Every business table has RLS enabled with policies that ensure users can only access data from their organization.

---

## RLS Strategy

### Core Principles

1. **Organization Isolation** - Users can only access data belonging to their organization
2. **User Verification** - Every query verifies the user belongs to the organization
3. **Super Admin Bypass** - Super admins bypass organization restrictions (handled at application level)
4. **Progressive Restriction** - More specific policies build on organization checks

### Query Evaluation

When a user queries a table with RLS:

```
User Query
    ↓
[RLS Policy Evaluation]
    ↓
[Check Organization Access]
    ↓
[Check Role-Based Restrictions]
    ↓
[Return Authorized Rows Only]
```

---

## Table-Specific Policies

### organizations

**Purpose:** Control access to organization records

**Policies:**

- `organizations_isolation` - Users can view their organization or organizations they belong to

**Implementation:**

```sql
CREATE POLICY "organizations_isolation" ON organizations
  FOR SELECT USING (
    auth.uid()::text = organizations.id::text OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = organizations.id
      AND users.id = auth.uid()
    )
  );
```

---

### branches

**Purpose:** Restrict branch access to organization members

**Policies:**

- `branches_organization_isolation` - Users can view branches in their organization

**Implementation:**

```sql
CREATE POLICY "branches_organization_isolation" ON branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = branches.organization_id
      AND users.id = auth.uid()
    )
  );
```

---

### users

**Purpose:** Control user visibility within organization

**Policies:**

- `users_organization_isolation` - Users can view other users in their organization

**Implementation:**

```sql
CREATE POLICY "users_organization_isolation" ON users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );
```

---

### roles

**Purpose:** Restrict role access to organization roles

**Policies:**

- `roles_organization_isolation` - Users can view roles in their organization

**Implementation:**

```sql
CREATE POLICY "roles_organization_isolation" ON roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );
```

---

### role_permissions

**Purpose:** Control visibility of role-permission assignments

**Policies:**

- `role_permissions_organization_isolation` - Users can view permissions for roles in their organization

**Implementation:**

```sql
CREATE POLICY "role_permissions_organization_isolation" ON role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM roles
      WHERE organization_id IN (
        SELECT organization_id FROM users
        WHERE users.id = auth.uid()
      )
    )
  );
```

---

### user_roles

**Purpose:** Control visibility of user role assignments

**Policies:**

- `user_roles_organization_isolation` - Users can view role assignments for users in their organization

**Implementation:**

```sql
CREATE POLICY "user_roles_organization_isolation" ON user_roles
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users
      WHERE organization_id IN (
        SELECT organization_id FROM users
        WHERE users.id = auth.uid()
      )
    )
  );
```

---

### organization_settings

**Purpose:** Control access to organization configuration

**Policies:**

- `organization_settings_isolation` - Users can view settings for their organization

**Implementation:**

```sql
CREATE POLICY "organization_settings_isolation" ON organization_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );
```

---

### audit_logs

**Purpose:** Restrict audit log visibility to organization members

**Policies:**

- `audit_logs_organization_isolation` - Users can view audit logs for their organization

**Implementation:**

```sql
CREATE POLICY "audit_logs_organization_isolation" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );
```

---

### permissions

**Purpose:** Make permissions globally readable (shared system resource)

**Policies:**

- `permissions_public_read` - All authenticated users can view permissions

**Implementation:**

```sql
CREATE POLICY "permissions_public_read" ON permissions
  FOR SELECT USING (TRUE);
```

---

## Storage Bucket Policies

### avatars

**Purpose:** Control user avatar access

**Policies:**

- `avatars_select` - Users can view avatars they own or avatars of users in their organization
- `avatars_insert` - Users can upload their own avatars
- `avatars_update` - Users can update their own avatars
- `avatars_delete` - Users can delete their own avatars

---

### organization-logos

**Purpose:** Control organization logo uploads

**Policies:**

- `org_logos_select` - Organization members can view logos
- `org_logos_insert` - Organization admins can upload logos
- `org_logos_delete` - Organization admins can delete logos

---

### documents

**Purpose:** Control document access

**Policies:**

- `documents_select` - Organization members can view documents
- `documents_insert` - Organization members can upload documents
- `documents_delete` - Document owners can delete

---

### temp

**Purpose:** Temporary file uploads

**Policies:**

- `temp_select` - Users can view their own temp files
- `temp_insert` - Users can upload temp files
- `temp_delete` - Users can delete their temp files

---

## Future Policy Enhancements

### Branch-Level Restrictions

When branch assignments are implemented:

```sql
CREATE POLICY "branch_restriction" ON {table}
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM users
      WHERE users.id = auth.uid()
    )
  );
```

### Role-Based Field Access

When advanced permissions are needed:

```sql
CREATE POLICY "role_based_access" ON {table}
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()
      AND p.code = '{module}.{action}'
    )
  );
```

---

## Testing RLS Policies

### Test Isolation

```sql
-- Test as user from organization A
SELECT * FROM organizations;
-- Should only return organization A

-- Test as user from organization B
SELECT * FROM organizations;
-- Should only return organization B
```

### Test Cross-Organization Access

```sql
-- Attempt to access another organization's users
SELECT * FROM users
WHERE organization_id = 'other-org-uuid';
-- Should return no rows
```

### Test Authenticated Access

```sql
-- Attempt anonymous access
SELECT * FROM users;
-- Should fail with permission denied
```

---

## Performance Considerations

1. **Subquery Optimization** - RLS policies use subqueries; ensure indexes exist
2. **Connection Pooling** - Use PgBouncer for high-concurrency scenarios
3. **Policy Complexity** - Simple policies perform better; cache results in application
4. **Index Strategy** - Indexes on organization_id critical for performance

---

## Troubleshooting

### Users See No Data

**Cause:** User record missing from users table
**Solution:** Verify user exists and is assigned to organization

### Slow Queries

**Cause:** Missing indexes or complex policies
**Solution:** Check EXPLAIN ANALYZE; add indexes on organization_id

### Permission Denied

**Cause:** RLS policy blocking legitimate access
**Solution:** Review policy logic; check user organization assignment

---

## Migration from Previous Policy

When updating RLS policies:

1. Create new policy with different name
2. Test thoroughly in development
3. Enable in staging
4. Schedule production rollout
5. Keep old policy as backup until verified

---

## Audit Logging of RLS Activity

RLS denials are not automatically logged. Implement triggers on sensitive tables to audit rejected access attempts:

```sql
CREATE TRIGGER log_access_attempt
BEFORE SELECT ON {sensitive_table}
FOR EACH STATEMENT
EXECUTE FUNCTION log_rls_check();
```

---

## Related Documentation

- [Database Design](../README.md)
- [Multi-Tenancy Strategy](../README.md)
- [Security Architecture](../../ARCHITECTURE.md)
