# ThuisZorgHub — Known Limitations & Blockers

**Document Date:** 2026-06-30  
**Platform Version:** 0.5 (Partial Integration)  
**Status:** BLOCKERS IDENTIFIED - See Critical Path Below

---

## CRITICAL BLOCKERS (MUST FIX)

### 1. Missing Authentication UI Pages ⚠️ SEVERITY: CRITICAL

**Impact:** Blocks 100% of user workflows

**Missing Files:**
1. `src/app/auth/register/page.tsx` - User registration page
2. `src/app/auth/login/page.tsx` - User login page
3. `src/app/auth/layout.tsx` - Auth layout wrapper
4. `src/components/auth/RegisterForm.tsx` - Registration form component
5. `src/components/auth/LoginForm.tsx` - Login form component
6. `src/app/reset-password/page.tsx` - Password reset page
7. `src/components/auth/ForgotPasswordForm.tsx` - Forgot password form

**Workaround:** None. Cannot access platform without these pages.

**Fix Effort:** 4-6 hours

**Fix Implementation:**
```typescript
// Example: src/app/auth/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/core/auth/service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await AuthService.signIn({ email, password });
      router.push('/admin');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="max-w-md w-full">
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border rounded mb-4"
        />
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
```

---

### 2. No Route Protection Middleware ⚠️ SEVERITY: CRITICAL

**Impact:** Admin pages accessible without authentication (security issue)

**Problem:**
- All `/admin/*` routes are publicly accessible
- No middleware checking authentication status
- Unauthenticated users can view sensitive data
- No redirect to login page

**Current Behavior:**
```
GET /admin → Returns page with 0 data (accessible anonymously)
GET /admin/employees → Returns empty list (accessible anonymously)
GET /admin/clients → Returns empty list (accessible anonymously)
```

**Expected Behavior:**
```
GET /admin (unauthenticated) → 307 Redirect to /auth/login
GET /admin/employees (unauthenticated) → 307 Redirect to /auth/login
```

**Workaround:** None. Manually ensure only authenticated users access admin.

**Fix Effort:** 2-3 hours

**Fix Implementation:**
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token');
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/protected/:path*'],
};
```

---

### 3. Incomplete User Profile in Auth Context ⚠️ SEVERITY: HIGH

**Impact:** User info incomplete, cannot scope queries to organization

**Problem:**
```typescript
// Current user profile has empty fields:
{
  id: "uuid-from-auth",
  email: "user@example.com",
  firstName: "",              // Empty!
  lastName: "",               // Empty!
  organizationId: "",         // Empty!
  timezone: "UTC",            // Default, not personalized
  language: "en"              // Default, not personalized
}
```

**Root Cause:** Auth context doesn't fetch user record from `users` table

**Workaround:** Manually fetch user profile after login in each component

**Fix Effort:** 1-2 hours

**Fix Implementation:**
```typescript
// In auth-context.tsx, after auth.getSession():
const { data: userRecord } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .single();

const userProfile: UserProfile = {
  id: session.user.id,
  email: session.user.email,
  firstName: userRecord?.first_name || '',
  lastName: userRecord?.last_name || '',
  organizationId: userRecord?.organization_id || '',
  // ... rest of fields
};
```

---

## HIGH-PRIORITY BLOCKERS

### 4. Missing Onboarding Flow ⚠️ SEVERITY: HIGH

**Impact:** New organizations cannot set up the platform

**Missing:**
- `/src/app/onboarding/page.tsx` - Onboarding home
- `/src/app/onboarding/layout.tsx` - Onboarding layout
- `/src/components/onboarding/WizardLayout.tsx` - Wizard wrapper
- `/src/components/onboarding/steps/` - Individual step components
  - `Step1Welcome.tsx`
  - `Step2Organization.tsx`
  - `Step3Branch.tsx`
  - `Step4Users.tsx`
  - etc.

**Expected Workflow:**
1. User signs up
2. Redirected to `/onboarding`
3. Step 1: Welcome & org name
4. Step 2: Organization details
5. Step 3: Create first branch
6. Step 4: Invite team members
7. Step 5: Configure settings
8. Complete → Redirected to `/admin`

**Workaround:** Manual database entries for org/branch/users

**Fix Effort:** 6-8 hours

---

### 5. Admin Dashboard Not Populated ⚠️ SEVERITY: HIGH

**Impact:** No visibility into platform metrics

**Current State:**
```typescript
// /admin/page.tsx shows:
<p className="text-3xl font-bold text-blue-600">0</p>  // Hardcoded zero
<p className="text-3xl font-bold text-green-600">0</p> // Hardcoded zero
```

**Should Be:**
```typescript
// Fetch real metrics from API
const metrics = await fetch('/api/metrics', {
  headers: { 'Authorization': `Bearer ${session.accessToken}` }
}).then(r => r.json());

// Display actual numbers:
{metrics.visitCount}
{metrics.employeeCount}
{metrics.clientCount}
{metrics.carePlanCount}
```

**Required Additions:**
1. `/api/metrics` endpoint to fetch statistics
2. Dashboard logic to fetch and display real data
3. Recent activity feed showing latest actions
4. Quick action cards (create employee, schedule visit, etc.)

**Workaround:** None. Dashboard is informational only.

**Fix Effort:** 3-4 hours

---

## MEDIUM-PRIORITY LIMITATIONS

### 6. Calendar View Not Implemented (Scheduling Page)

**Current:**
```typescript
} else (view === "calendar" ? (
  <div className="text-center py-12 text-gray-600">
    <p>Calendar view coming soon</p>
  </div>
```

**Impact:** Users can only use list view for scheduling

**Required:**
- Integration with calendar library (react-big-calendar, react-calendar, etc.)
- Month/week/day view switching
- Drag-and-drop visit scheduling
- Color-coding by employee/status

**Fix Effort:** 4-6 hours

---

### 7. Board View Not Implemented (Scheduling Page)

**Current:**
```typescript
} else (
  <div className="text-center py-12 text-gray-600">
    <p>Scheduling board coming soon</p>
  </div>
```

**Impact:** Cannot use kanban-style scheduling

**Required:**
- Employee columns
- Visit cards draggable between employees
- Conflict detection on drag
- Auto-save on drop

**Fix Effort:** 4-6 hours

---

### 8. CRUD Dialogs/Modals Not Implemented

**Current:** Pages exist but lack create/edit/delete modals

**Missing Components:**
- BranchDialog for creating/editing branches
- EmployeeDialog for creating/editing employees
- ClientDialog for creating/editing clients
- CarePlanDialog for creating/editing care plans
- AssignmentDialog for creating assignments
- etc.

**Impact:** Cannot actually create/edit data through UI

**Workaround:** Direct API calls via curl/Postman (for testing)

**Fix Effort:** 8-12 hours (for all dialogs)

---

### 9. Search Results Don't Navigate

**Current:** Topbar search shows results but links might be broken

**Issue:** Search displays employees/clients/branches but links may go to non-existent detail pages

**Example:**
```typescript
href={`/admin/employees/${result.id}`}  // Page might not exist
href={`/admin/clients/${result.id}`}    // Page might not exist
```

**Fix:** Create detail pages for employees, clients, etc.

**Fix Effort:** 4-6 hours

---

### 10. No Real-Time Notifications

**Current:** Notifications bell in topbar is static/placeholder

**Missing:**
- Notification preferences page functionality
- Email notification sending
- In-app notification display
- Real-time updates via WebSocket/polling

**Impact:** Users won't be notified of events

**Fix Effort:** 8-10 hours

---

## IMPLEMENTATION GAPS

### 11. Form Validation Missing

**Issue:** Create/edit forms lack validation

**Missing:**
- Email format validation
- Required field checks
- Date range validation
- Phone number formatting
- Address validation

**Current:** Forms accept any input

**Fix Effort:** 3-4 hours

---

### 12. Type Safety in API Responses

**Issue:** Most API routes use `any` type for flexibility but lack type safety

**Current:**
```typescript
const { data, error } = await (supabase.from("care_plans") as any).select("*");
```

**Proper:**
```typescript
const { data, error } = await supabase
  .from("care_plans")
  .select("*")
  .returns<CarePlan[]>();
```

**Impact:** No TypeScript validation of API responses, harder to debug

**Fix Effort:** 4-6 hours

---

### 13. Sorting & Filtering on List Pages

**Issue:** Pages show static lists, no sorting/filtering UI

**Missing:**
- Column header sort indicators
- Filter facets on left sidebar
- Multi-column sorting
- Search within list

**Fix Effort:** 2-3 hours per page

---

### 14. Pagination on List Pages

**Issue:** No pagination controls visible

**Missing:**
- Page size selector
- Next/previous buttons
- Page number display
- "Rows per page" selector

**Fix Effort:** 1-2 hours per page

---

### 15. Error Handling in UI

**Issue:** API errors not displayed to user

**Missing:**
- Error toast notifications
- Error boundary components
- Field-level validation errors
- Network error handling

**Fix Effort:** 2-3 hours

---

## DATA & INTEGRATION GAPS

### 16. RLS (Row-Level Security) Not Verified

**Issue:** Database has RLS framework, but policies not validated in live environment

**Missing:**
- Test RLS policies actually prevent cross-org access
- Test RLS policies prevent unauthorized data access
- Verify soft-deleted records excluded via RLS

**Current:** RLS framework exists in schema, but not tested live

**Fix Effort:** 2-3 hours (testing)

---

### 17. Cascading Deletes Not Tested

**Issue:** Database has cascade rules, but behavior not verified

**Missing:**
- Test deleting organization cascades correctly
- Test deleting branch cascades correctly
- Test soft deletes don't cascade
- Verify audit logs remain

**Fix Effort:** 1-2 hours (testing)

---

### 18. Foreign Key Constraints Not Verified

**Issue:** Foreign keys defined but not tested in live environment

**Missing:**
- Test cannot create employee without branch
- Test cannot delete branch with employees
- Test referential integrity enforced

**Fix Effort:** 1-2 hours (testing)

---

## SECURITY GAPS

### 19. No CSRF Protection

**Issue:** POST/PATCH/DELETE endpoints not protected against CSRF

**Missing:**
- CSRF token generation
- CSRF token validation
- Same-site cookie flags

**Current:** Next.js provides some protection, but explicit validation would be better

**Fix Effort:** 1-2 hours

---

### 20. API Rate Limiting Not Implemented

**Issue:** No protection against API abuse

**Missing:**
- Rate limiting per IP
- Rate limiting per user
- Rate limiting per endpoint
- Graceful rate limit responses (429 Too Many Requests)

**Fix Effort:** 2-3 hours

---

### 21. Input Validation Not Comprehensive

**Issue:** API routes accept any input without validation

**Missing:**
- Request body schema validation
- Query parameter validation
- File upload validation
- XSS prevention on string fields

**Fix Effort:** 3-4 hours

---

## OPERATIONAL GAPS

### 22. No Database Backups Configuration

**Issue:** Supabase backups not explicitly configured

**Missing:**
- Backup schedule (daily, weekly)
- Backup retention policy
- Backup testing
- Disaster recovery procedure

**Fix Effort:** 1 hour (configuration)

---

### 23. No Monitoring/Logging

**Issue:** No visibility into application health

**Missing:**
- Error tracking (Sentry, LogRocket)
- Performance monitoring (New Relic, Datadog)
- Log aggregation (CloudWatch, Stackdriver)
- Alerting on errors

**Fix Effort:** 2-3 hours (setup)

---

### 24. No CI/CD Pipeline

**Issue:** No automated testing or deployment

**Missing:**
- GitHub Actions workflow
- Automated test runs
- Automated linting
- Automated deployment
- Staging environment

**Fix Effort:** 4-6 hours

---

## TESTING GAPS

### 25. No Automated Tests

**Issue:** No unit tests, integration tests, or E2E tests

**Missing:**
- Unit tests for utilities
- API endpoint tests
- Component tests
- E2E tests for workflows
- Performance tests

**Current:** Manual testing only

**Fix Effort:** 10-15 hours

---

## DOCUMENTATION GAPS

### 26. No API Documentation

**Issue:** API endpoints not documented for developers

**Missing:**
- OpenAPI/Swagger documentation
- Request/response examples
- Error code documentation
- Authentication guide

**Fix Effort:** 3-4 hours

---

### 27. No Architecture Documentation

**Issue:** System design not documented

**Missing:**
- Database schema diagram
- API architecture diagram
- Auth flow diagram
- Data flow diagram

**Fix Effort:** 2-3 hours

---

### 28. No Deployment Guide

**Issue:** Instructions for deploying to production missing

**Missing:**
- Environment variable setup
- Database migration steps
- Supabase configuration
- Next.js deployment
- Domain setup
- SSL certificate setup

**Fix Effort:** 2-3 hours

---

## SUMMARY TABLE

| Category | Count | Severity | Impact |
|----------|-------|----------|--------|
| Critical Blockers | 3 | CRITICAL | Blocks all workflows |
| High Priority | 2 | HIGH | Blocks new org setup |
| Medium Priority | 5 | MEDIUM | Limits functionality |
| Implementation Gaps | 10 | LOW-MEDIUM | Incomplete features |
| Data/Integration Gaps | 3 | MEDIUM | Unverified |
| Security Gaps | 3 | MEDIUM-HIGH | Risk exposure |
| Operational Gaps | 3 | MEDIUM | Prod readiness |
| Testing Gaps | 1 | MEDIUM | Quality risk |
| Documentation Gaps | 3 | LOW | Maintenance burden |

**Total Identified Issues: 33**

**Critical Path:** Fix 3 blockers first (Auth UI, Route Protection, User Profile)

**Time to Remove All Blockers:** 8-12 hours

**Time to Production Ready:** 25-35 hours

---

## PRIORITY ROADMAP

### Phase 1: Critical Path (MUST COMPLETE)
**Effort: 8-12 hours**

1. ✅ Create authentication UI pages (4-6 hrs)
2. ✅ Add route protection middleware (2-3 hrs)
3. ✅ Complete user profile loading (1-2 hrs)

### Phase 2: High Priority (SHOULD COMPLETE)
**Effort: 6-8 hours**

4. Create onboarding flow (6-8 hrs)
5. Populate admin dashboard (3-4 hrs)

### Phase 3: Medium Priority (NICE TO HAVE)
**Effort: 8-12 hours**

6. Implement calendar/board views (8-12 hrs)
7. Add CRUD dialogs (8-12 hrs)
8. Complete search navigation (4-6 hrs)

### Phase 4: Polish (BEFORE PRODUCTION)
**Effort: 20-30 hours**

- Form validation (3-4 hrs)
- Error handling (2-3 hrs)
- Type safety improvements (4-6 hrs)
- Real-time notifications (8-10 hrs)
- Automated testing (10-15 hrs)
- Monitoring setup (2-3 hrs)
- Documentation (8-10 hrs)

---

## HOW TO USE THIS DOCUMENT

1. **For Development:** Use as checklist of what's missing
2. **For QA:** Use to plan testing scope
3. **For Product:** Use to prioritize work
4. **For Security:** Use to identify risk areas
5. **For Operations:** Use to plan deployment

---

## ASSUMPTIONS

This assessment assumes:
- Supabase backend is properly configured
- Environment variables are correctly set
- Network connectivity to Supabase
- Browser supports ES2020+ JavaScript
- Users have reasonable internet speed

---

## REVISION HISTORY

| Date | Version | Notes |
|------|---------|-------|
| 2026-06-30 | 1.0 | Initial assessment after stashed features recovery |

---

## CONTACT & UPDATES

For questions or updates to this document, refer to:
- INTEGRATION_REPORT.md (detailed findings)
- TEST_CHECKLIST.md (testing progress)
- Repository git history for changes
