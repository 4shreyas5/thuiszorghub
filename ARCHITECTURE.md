# ThuisZorgHub - Production Architecture

## Overview

ThuisZorgHub is built as a feature-first, multi-tenant SaaS application with a clear separation of concerns and scalable architecture designed for production use.

---

## Folder Structure

### `/src` - Application Source Code

#### Core Layer (`src/core`)

Foundation services and utilities used across the application.

- **`core/auth`** - Authentication session management, token handling
- **`core/database`** - Supabase client initialization, query builders
- **`core/permissions`** - Role-based access control (RBAC), permission guards
- **`core/config`** - Global configuration, i18n settings
- **`core/providers`** - React context providers (authentication, theme, etc.)
- **`core/middleware`** - Request/response middleware, tenant resolution

#### Shared Layer (`src/shared`)

Reusable code shared across multiple features.

- **`shared/components`** - Reusable UI components, layout components
- **`shared/components/ui`** - shadcn/ui components (auto-generated)
- **`shared/hooks`** - Custom React hooks (useAuth, useTenant, etc.)
- **`shared/utils`** - Utility functions (formatting, dates, validation)
- **`shared/constants`** - Application constants, enums
- **`shared/types`** - Shared type definitions
- **`shared/schemas`** - Zod validation schemas
- **`shared/icons`** - Icon components

#### Features Layer (`src/features`)

Business domain modules. Each feature is self-contained and can own:

- Components
- Hooks
- API routes
- Types
- Utils
- Schemas
- Services

**Current Features:**

- `features/auth` - Authentication (login, signup, password reset)
- `features/organization` - Organization management, multi-tenancy
- `features/branch` - Office/branch management
- `features/user` - User management, invitations, profiles
- `features/employee` - Employee management, scheduling
- `features/client` - Client/patient management
- `features/scheduling` - Appointment and schedule management
- `features/calendar` - Calendar and event views
- `features/visit` - Visit tracking and management
- `features/tasks` - Task management
- `features/notes` - Notes and documentation
- `features/documents` - Document storage and management
- `features/notifications` - Notification system
- `features/messaging` - Internal messaging
- `features/reports` - Reports and analytics
- `features/billing` - Subscription and billing
- `features/settings` - Application settings
- `features/audit-logs` - Audit trail
- `features/dashboard` - Dashboard and widgets
- `features/admin` - Admin portal

#### Types (`src/types`)

Domain-specific type definitions organized by feature:

- `types/common.ts` - Common types (Locale, ApiResponse, Pagination)
- `types/auth.ts` - Authentication types
- `types/organization.ts` - Organization types
- `types/branch.ts` - Branch types
- `types/user.ts` - User and role types
- `types/employee.ts` - Employee types
- `types/client.ts` - Client types
- `types/visit.ts` - Visit types
- `types/schedule.ts` - Schedule types
- `types/document.ts` - Document types
- `types/notification.ts` - Notification types
- `types/audit.ts` - Audit log types
- `types/billing.ts` - Billing types

#### App Router (`src/app`)

Next.js App Router pages and API routes.

- `app/api/*` - API endpoints
- `app/auth/*` - Authentication pages
- `app/dashboard/*` - Dashboard pages
- `app/admin/*` - Admin portal pages
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `app/globals.css` - Global styles
- `app/[locale]/*` - Locale-based routing (future implementation)

#### Middleware (`src/middleware`)

Request/response processing middleware.

- `middleware/index.ts` - Tenant resolution, auth checking
- `middleware/cors.ts` - CORS handling (future)
- `middleware/logging.ts` - Request/response logging (future)

---

### `/supabase` - Database Configuration

Database migrations, policies, and functions.

- `supabase/migrations/` - SQL migration files (versioned by timestamp)
- `supabase/policies/` - Row Level Security (RLS) policies
- `supabase/functions/` - PostgreSQL functions and Edge functions
- `supabase/seed/` - Initial data seeding
- `supabase/storage/` - File storage bucket configuration
- `supabase/types/` - Auto-generated TypeScript types from database schema

---

### Configuration Files

| File                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `tsconfig.json`      | TypeScript configuration with path aliases |
| `next.config.ts`     | Next.js configuration                      |
| `tailwind.config.ts` | Tailwind CSS and design system             |
| `components.json`    | shadcn/ui configuration                    |
| `postcss.config.mjs` | PostCSS (for Tailwind)                     |
| `.eslintrc.mjs`      | ESLint rules and configuration             |
| `.prettierrc`        | Prettier formatting rules                  |
| `.prettierignore`    | Files to exclude from Prettier             |
| `.env.example`       | Environment variables template             |
| `.env.local`         | Local environment variables (gitignored)   |
| `.gitignore`         | Git ignore rules                           |
| `package.json`       | Dependencies and npm scripts               |
| `ARCHITECTURE.md`    | This file                                  |

---

## Design Principles

### 1. Feature-First Architecture

- Each business domain owns its code
- Features are self-contained and loosely coupled
- Shared code lives in `shared/` or `core/` only
- Avoids circular dependencies

### 2. Multi-Tenancy

- Organization isolation enforced at database level (RLS)
- Tenant context extracted from request headers
- No shared data between organizations

### 3. Type Safety

- TypeScript in strict mode
- Domain types separated by feature
- No `any` types allowed
- Comprehensive type definitions

### 4. Permissions & Security

- Role-Based Access Control (RBAC) system
- Permission guards in core layer
- RLS policies in database
- Audit logging for compliance

### 5. Code Organization

- Avoid long files (< 300 lines)
- Separate concerns (UI, logic, data)
- Reusable components in `shared/`
- Feature-specific code in `features/`

### 6. Performance

- Code splitting by feature
- Image optimization enabled
- CSS-in-JS via Tailwind
- TanStack Query for server state

### 7. Developer Experience

- Clean path aliases
- Consistent naming conventions
- Auto-formatting with Prettier
- Pre-commit linting with Husky

---

## Path Aliases

Clean imports across the codebase:

```typescript
// Instead of:
import { Button } from "../../../components/ui/button";

// Use:
import { Button } from "@/shared/components/ui/button";
import { auth } from "@/core/auth/session";
import { User } from "@/types/user";
import { formatDate } from "@/shared/utils/date";
```

**Available Aliases:**

- `@/*` → `./src/*`
- `@/core/*` → `./src/core/*`
- `@/shared/*` → `./src/shared/*`
- `@/features/*` → `./src/features/*`
- `@/types/*` → `./src/types/*`
- `@/middleware/*` → `./src/middleware/*`
- `@/config/*` → `./src/config/*`
- `@/i18n/*` → `./src/i18n/*`

---

## Data Flow

### API Request Flow

```
Client Request
    ↓
[Middleware] - Extract tenant/user context
    ↓
[Route Handler] - Validate permissions
    ↓
[Service] - Execute business logic
    ↓
[Database] - Query/mutate data with RLS
    ↓
[API Response] - Return formatted response
```

### Component State Flow

```
User Action
    ↓
[Event Handler] - Update component state
    ↓
[TanStack Query] - Fetch/mutate server data
    ↓
[API Route] - Server-side processing
    ↓
[Database] - Persist changes
    ↓
[Query Invalidation] - Refresh client cache
    ↓
[UI Update] - Re-render with new data
```

---

## Multi-Tenancy Implementation

### Tenant Context

Every request includes tenant context:

```typescript
interface TenantContext {
  organizationId: string; // Required: Organization UUID
  branchId?: string; // Optional: Branch UUID
  userId?: string; // Optional: User UUID
}
```

### Isolation Points

1. **Middleware** - Extract tenant from request headers or URL
2. **API Routes** - Validate tenant access
3. **Database** - RLS policies enforce isolation
4. **Queries** - Always filter by `organization_id`
5. **UI** - Show organization-specific content

### RLS Policies

All tables protected with policies:

```sql
-- Example: Users can only see their organization's data
CREATE POLICY "organization_isolation" ON users
  USING (organization_id = auth.jwt_claim('org_id')::uuid);
```

---

## Authentication Flow

### Session Management

```
User Login
    ↓
[Supabase Auth] - Validate credentials
    ↓
[Session Created] - JWT tokens issued
    ↓
[Session Stored] - Tokens in localStorage
    ↓
[App State] - AuthContext updated
    ↓
[Protected Routes] - Redirect to dashboard
```

### Token Refresh

- Access token: ~1 hour expiration
- Refresh token: 7 days expiration
- Automatic refresh before expiry
- Logout on refresh failure

---

## Role-Based Access Control

### Roles

- **Super Admin** - Platform administration
- **Organization Admin** - Organization management
- **Branch Manager** - Branch-specific access
- **Employee** - Limited to assigned clients/visits
- **Client** - Self-service portal access (future)

### Permissions

Granular permissions per resource and action:

```typescript
type Permission = `${Resource}:${Action}`;

// Examples:
("organizations:manage");
("users:create");
("employees:read");
("visits:update");
("documents:delete");
```

### Permission Checking

```typescript
const guard = new PermissionGuard();
guard.requirePermission(context, {
  resource: "users",
  action: "create",
});
```

---

## Environment Configuration

### Environment Variables

**Required:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin service key

**Optional:**

- `SENDGRID_API_KEY` - For email notifications
- `NEXT_PUBLIC_SENTRY_DSN` - For error tracking
- `NEXT_PUBLIC_POSTHOG_KEY` - For analytics

See `.env.example` for complete list.

---

## Code Quality Standards

### TypeScript

- Strict mode enabled
- No implicit `any`
- Unused variables detection
- Return type annotations required

### Linting

- ESLint with TypeScript rules
- Prettier for consistent formatting
- Import sorting

### Testing (Future)

- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows

### Pre-commit Hooks

- TypeScript type checking
- ESLint validation
- Prettier formatting
- Prevents commits with errors

---

## Performance Considerations

### Bundle Size

- Feature-based code splitting
- Tree-shaking unused code
- Lazy loading of components
- Production builds remove console.log

### Database

- Indexes on foreign keys
- Pagination for large datasets
- Connection pooling
- Query optimization

### Caching

- TanStack Query client-side caching
- Automatic stale time management
- Smart invalidation

### Images

- Next.js Image optimization
- WebP format support
- Responsive sizing

---

## Security Architecture

### Data Protection

- All data transmitted over HTTPS
- Encrypted sensitive data in database
- No secrets in frontend code
- Service role key server-only

### Access Control

- RLS policies at database level
- RBAC in application layer
- Audit logging of all actions
- Session timeout enforcement

### Authentication

- Supabase Auth (OAuth, Email)
- Secure password hashing
- Email verification
- Password reset flow

### Compliance

- GDPR-ready (data deletion, export)
- Audit trails for all changes
- Data retention policies
- Soft deletes for audit

---

## Scalability Strategy

### Horizontal Scaling

- Stateless app tier
- Database connection pooling
- CDN for static assets
- Multi-region deployment ready

### Vertical Optimization

- Query optimization
- Index strategies
- Batch operations
- Caching layers

### Future Growth

- Edge function capabilities
- Real-time sync with Supabase
- Webhook support
- Message queue integration

---

## Deployment

### Environments

- **Development** - Local machine, hot reload
- **Staging** - Production-like testing
- **Production** - Live users

### Hosting

- **App** - Vercel (serverless Next.js)
- **Database** - Supabase (managed PostgreSQL)
- **Storage** - Supabase Storage (S3-compatible)
- **Auth** - Supabase Auth (OAuth provider)

### CI/CD

- TypeScript compilation check
- ESLint validation
- Test execution
- Auto-deployment on merge

---

## Getting Started

### Project Setup

```bash
npm install
npm run dev
```

### Environment Setup

1. Create Supabase project
2. Copy `.env.example` to `.env.local`
3. Add Supabase credentials
4. Run migrations

### First Feature

1. Create feature folder: `src/features/my-feature/`
2. Add types, components, APIs
3. Import from feature in app router
4. Add route to navigation

---

## Common Patterns

### Feature Structure

```
src/features/my-feature/
├── components/      # UI components
├── hooks/          # Custom hooks
├── api/            # API routes
├── types.ts        # Feature types
├── utils.ts        # Helpers
└── schemas.ts      # Validation
```

### API Endpoint

```typescript
// app/api/my-feature/route.ts
export async function GET(request: NextRequest) {
  const tenant = TenantResolver.extractFromRequest(request);
  // ... handle request
  return NextResponse.json({ success: true, data });
}
```

### Component with Data

```typescript
// shared/components/my-component.tsx
import { useQuery } from '@tanstack/react-query';

export function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: fetchMyData,
  });

  return <div>{/* render data */}</div>;
}
```

---

## Future Enhancements

- [ ] GraphQL API layer
- [ ] Real-time updates with Supabase subscriptions
- [ ] Advanced reporting and dashboards
- [ ] Mobile app (React Native)
- [ ] Webhook integrations
- [ ] Message queue for async operations
- [ ] Advanced search with full-text indexing
- [ ] ML-based recommendations

---

## Related Documentation

- [Master Software Specification](docs/ThuisZorgHub%20-%20Master%20Software%20Specification%20v1.0.md)
- [Sprint 01 Foundation](docs/Sprint-01-Foundation.md)
- [Project Setup](PROJECT_SETUP.md)
- [Setup Complete](SETUP_COMPLETE.md)
