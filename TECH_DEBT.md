# ThuisZorgHub — Technical Debt Inventory

**Audit Date:** 2026-06-30  
**Classification:** Internal Use  

---

## Summary

**Total Items:** 47 technical debt items identified  
**Critical:** 6  
**High:** 14  
**Medium:** 18  
**Low:** 9  

**Estimated Remediation Effort:** 8-12 weeks (full-time team)  
**Cost (if outsourced):** $50K-$80K USD

---

## CRITICAL DEBT (Must Fix Before Production)

### 1. RLS Organizations Policy Bug — DATABASE

**Severity:** CRITICAL  
**Effort:** 30 minutes  
**Impact:** Data isolation vulnerability

**Issue:**
```sql
CREATE POLICY "organizations_isolation" ON organizations
  FOR SELECT USING (
    auth.uid()::text = organizations.id::text  -- WRONG
  );
```

**Problem:** Compares user UUID to organization UUID, which never matches.

**Fix:**
```sql
CREATE POLICY "organizations_isolation" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = organizations.id
      AND users.id = auth.uid()
    )
  );
```

**Status:** 🔴 BLOCKED  
**Priority:** CRITICAL  
**Assigned:** Architecture

---

### 2. Missing API Routes — BACKEND

**Severity:** CRITICAL  
**Effort:** 80-100 developer-days  
**Impact:** Cannot build any features

**Missing Routes:**
- ❌ `/api/organizations` (CRUD)
- ❌ `/api/branches` (CRUD)
- ❌ `/api/users` (CRUD)
- ❌ `/api/roles` (CRUD)
- ❌ `/api/audit-logs` (Read)
- ❌ Business domain APIs (employees, clients, visits, etc.)

**Status:** 🔴 NOT STARTED  
**Priority:** CRITICAL  
**Assigned:** Backend Team  
**Timeline:** Week 1-8

---

### 3. Auth Context Incomplete — FRONTEND

**Severity:** CRITICAL  
**Effort:** 8 developer-days  
**Impact:** Cannot authenticate users

**Issues:**
```typescript
// INCOMPLETE
const userProfile: UserProfile = {
  id: currentSession.user.id,
  email: currentSession.user.email,
  firstName: '', // ← Hardcoded!
  lastName: '',  // ← Hardcoded!
  organizationId: '', // ← Hardcoded!
  // Comments: "To be fetched from database"
};
```

**Fix:**
1. Fetch full user profile from database
2. Load organization ID
3. Load user roles
4. Load permissions

**Status:** 🔴 INCOMPLETE  
**Priority:** CRITICAL  
**Assigned:** Frontend Team  
**Timeline:** Week 2-4 (after API routes)

---

### 4. No Input Validation Layer — SECURITY

**Severity:** CRITICAL  
**Effort:** 5 developer-days  
**Impact:** XSS, injection attacks possible

**Missing:**
- ❌ Request schema validation
- ❌ Form input validation
- ❌ API response validation
- ❌ Error message sanitization

**Solution:** Implement Zod validation throughout

**Status:** 🔴 NOT STARTED  
**Priority:** CRITICAL  
**Assigned:** Security Team  
**Timeline:** Week 2-3

---

### 5. No Audit Logging — COMPLIANCE

**Severity:** CRITICAL  
**Effort:** 5 developer-days  
**Impact:** Cannot demonstrate compliance

**Missing:**
- ❌ Action logging middleware
- ❌ Data change tracking
- ❌ Access logging
- ❌ Security event logging

**Status:** 🔴 NOT STARTED  
**Priority:** CRITICAL  
**Assigned:** Backend Team  
**Timeline:** Week 4-5

---

### 6. Missing Business Domain Tables — DATABASE

**Severity:** CRITICAL  
**Effort:** 20 developer-days  
**Impact:** Cannot track core business objects

**Missing Tables:**
- ❌ employees
- ❌ clients
- ❌ visits
- ❌ schedules
- ❌ care_plans
- ❌ documents
- ❌ notifications
- ❌ messages

**Status:** 🔴 NOT STARTED  
**Priority:** CRITICAL  
**Assigned:** Data Architect  
**Timeline:** Week 3-6

---

## HIGH PRIORITY DEBT (Before Beta Launch)

### 7. No Rate Limiting — SECURITY

**Severity:** HIGH  
**Effort:** 3 developer-days  
**Impact:** Brute force vulnerable

**Solution:** Implement sliding window rate limiter  
**Status:** 🔴 NOT STARTED

---

### 8. No Security Headers — SECURITY

**Severity:** HIGH  
**Effort:** 2 developer-days  
**Impact:** OWASP Top 10 violations

**Missing Headers:**
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security
- Content-Security-Policy
- X-XSS-Protection

**Status:** 🔴 NOT STARTED

---

### 9. Deprecated Middleware Pattern — ARCHITECTURE

**Severity:** HIGH  
**Effort:** 4 developer-days  
**Impact:** Technical debt, unsupported pattern

**Issue:** Using `middleware.ts` (deprecated in Next.js 16)  
**Solution:** Migrate to `proxy` in `next.config.ts`

**Status:** 🟡 NEEDS REFACTOR

---

### 10. No Database Connection Pooling — PERFORMANCE

**Severity:** HIGH  
**Effort:** 1 developer-day  
**Impact:** Connection exhaustion at scale

**Solution:** Configure PgBouncer or Supabase connection pooling  
**Status:** 🔴 NOT CONFIGURED

---

### 11. Unbounded Audit Logs — DATABASE

**Severity:** HIGH  
**Effort:** 3 developer-days  
**Impact:** Storage bloat, query slowdown

**Solution:** Implement retention policy, archival  
**Status:** 🔴 NOT STARTED

---

### 12. No Monitoring Infrastructure — OPERATIONS

**Severity:** HIGH  
**Effort:** 5 developer-days  
**Impact:** Cannot debug production

**Missing:**
- Error tracking (Sentry)
- APM (New Relic/Datadog)
- Structured logging
- Alerting

**Status:** 🔴 NOT STARTED

---

### 13. No Testing Infrastructure — QA

**Severity:** HIGH  
**Effort:** 8 developer-days  
**Impact:** No automated testing

**Missing:**
- Jest configuration
- Test utilities
- E2E test setup (Playwright)
- CI/CD pipeline

**Status:** 🔴 NOT STARTED

---

### 14. Session Refresh Incomplete — FRONTEND

**Severity:** HIGH  
**Effort:** 2 developer-days  
**Impact:** Users kicked out unexpectedly

**Missing:**
- Automatic token refresh
- Session expiration handling
- Refresh token rotation

**Status:** 🔴 PARTIAL

---

### 15. No CSRF Documentation — SECURITY

**Severity:** HIGH  
**Effort:** 1 developer-day  
**Impact:** Unclear CSRF handling

**Status:** 🔴 UNDOCUMENTED

---

### 16. No Pagination — BACKEND

**Severity:** HIGH  
**Effort:** 5 developer-days  
**Impact:** Cannot handle large datasets

**Status:** 🔴 NOT STARTED

---

### 17. TanStack Query Unused — FRONTEND

**Severity:** HIGH  
**Effort:** 3 developer-days  
**Impact:** Loss of caching benefits

**Status:** 🟡 INSTALLED, NOT USED

---

### 18. Soft Delete Pattern Clutters Code — DATABASE

**Severity:** HIGH  
**Effort:** 4 developer-days  
**Impact:** Every query needs `is_deleted = FALSE`

**Solution:** Implement views to hide soft delete logic  
**Status:** 🟡 ARCHITECTURAL ISSUE

---

### 19. RLS Query Optimization Needed — PERFORMANCE

**Severity:** HIGH  
**Effort:** 5 developer-days  
**Impact:** Will slow down with scale

**Current:** O(n) subqueries  
**Solution:** Database functions with cached context  
**Status:** 🔴 NOT OPTIMIZED

---

### 20. No Secrets Rotation — SECURITY

**Severity:** HIGH  
**Effort:** 2 developer-days  
**Impact:** Long-lived keys exposed

**Status:** 🔴 NOT IMPLEMENTED

---

## MEDIUM PRIORITY DEBT (Before Production)

### 21-38: Medium Priority Items

| # | Title | Severity | Effort | Status |
|---|-------|----------|--------|--------|
| 21 | No dark mode toggle | Medium | 1d | 🔴 |
| 22 | Incomplete onboarding flow | Medium | 5d | 🟡 |
| 23 | No form error handling | Medium | 3d | 🔴 |
| 24 | No loading states connected | Medium | 2d | 🔴 |
| 25 | No skeleton loaders used | Medium | 2d | 🔴 |
| 26 | Missing API documentation | Medium | 3d | 🔴 |
| 27 | No data validation schemas | Medium | 4d | 🔴 |
| 28 | Limited CORS configuration | Medium | 2d | 🔴 |
| 29 | No transaction support | Medium | 5d | 🔴 |
| 30 | No database backups tested | Medium | 3d | 🔴 |
| 31 | Missing deployment docs | Medium | 2d | 🔴 |
| 32 | No environment validation | Medium | 1d | 🔴 |
| 33 | PostCSS vulnerability | Medium | 2w | ⏳ (Next.js update) |
| 34 | Incomplete feature flags | Medium | 4d | 🔴 |
| 35 | No database naming conventions | Medium | 1d | 🟡 |
| 36 | Missing composite indexes | Medium | 1d | 🔴 |
| 37 | No query performance analysis | Medium | 2d | 🔴 |
| 38 | Limited error recovery | Medium | 3d | 🔴 |

---

## LOW PRIORITY DEBT (Nice to Have)

### 39-47: Low Priority Items

| # | Title | Severity | Effort | Status |
|---|-------|----------|--------|--------|
| 39 | Missing Storybook | Low | 5d | 🔴 |
| 40 | No E2E test examples | Low | 3d | 🔴 |
| 41 | Limited accessibility docs | Low | 2d | 🟡 |
| 42 | No design tokens export | Low | 2d | 🔴 |
| 43 | Limited i18n implementation | Low | 4d | 🟡 |
| 44 | Missing changelog | Low | 1d | 🔴 |
| 45 | No performance budgets | Low | 1d | 🔴 |
| 46 | Limited code comments | Low | 3d | 🟡 |
| 47 | No developer guide | Low | 2d | 🔴 |

---

## Debt by Category

### Architecture (8 items)

1. Deprecated middleware pattern
2. No feature flags
3. Missing business tables
4. Incomplete feature structure
5. No service layer architecture
6. Limited error boundaries
7. No configuration management
8. Missing GraphQL API option

### Security (12 items)

1. RLS policy bug
2. No input validation
3. No rate limiting
4. No security headers
5. No audit logging
6. No CSRF documentation
7. No secrets rotation
8. No request sanitization
9. No security headers
10. No rate limiting on auth
11. No 2FA support
12. No intrusion detection

### Performance (8 items)

1. No monitoring
2. RLS query optimization
3. No caching strategy
4. Unbounded audit logs
5. Soft delete overhead
6. No pagination
7. Session initialization inefficient
8. No asset compression

### Frontend (7 items)

1. Auth context incomplete
2. No data binding
3. No loading states
4. Onboarding incomplete
5. Dark mode not wired
6. TanStack Query unused
7. No form state management

### Database (8 items)

1. Missing business tables
2. Soft delete pattern
3. Unbounded audit logs
4. No connection pooling
5. Missing composite indexes
6. RLS query optimization
7. No transaction support
8. No backup strategy

### Operations (4 items)

1. No monitoring infrastructure
2. No structured logging
3. No deployment docs
4. No incident response plan

---

## Remediation Plan

### PHASE 1: Foundation (Weeks 1-2)

**Fix Critical Issues:**
- [ ] Fix RLS organizations policy (30 min)
- [ ] Implement input validation layer (5d)
- [ ] Add security headers (2d)
- [ ] Setup monitoring (Sentry) (3d)

**Effort:** 40 developer-hours  
**Blocks:** Nothing (foundational)

### PHASE 2: API Implementation (Weeks 3-8)

**Build API Routes:**
- [ ] Core API routes (20d)
- [ ] Business domain APIs (40d)
- [ ] Pagination/filtering (5d)
- [ ] Error handling (5d)

**Effort:** 280 developer-hours  
**Blocks:** Frontend feature work

### PHASE 3: Backend Features (Weeks 6-10)

**Implement Business Logic:**
- [ ] Create business tables (20d)
- [ ] Audit logging (5d)
- [ ] Database migrations (5d)
- [ ] API documentation (5d)

**Effort:** 210 developer-hours  
**Blocks:** Nothing (parallel with API)

### PHASE 4: Frontend Integration (Weeks 4-10)

**Wire Frontend to Backend:**
- [ ] Auth context completion (8d)
- [ ] Data binding (15d)
- [ ] Forms & submissions (10d)
- [ ] Loading/error states (5d)

**Effort:** 190 developer-hours  
**Blocks:** Nothing (depends on API)

### PHASE 5: Operations (Weeks 11-16)

**Production Readiness:**
- [ ] Monitoring dashboard (5d)
- [ ] Logging infrastructure (5d)
- [ ] Backup/recovery testing (5d)
- [ ] Deployment automation (5d)
- [ ] Documentation (10d)

**Effort:** 150 developer-hours  
**Blocks:** Production launch

---

## Cost-Benefit Analysis

### IF WE FIX (Estimated)

**Cost:** $50K-$80K (outsourced) or 3-4 months (4-person team)

**Benefits:**
- ✅ Production-ready platform
- ✅ Healthcare compliance possible
- ✅ Scalable to 10K+ organizations
- ✅ Security audit passable
- ✅ Monitoring & debugging possible

### IF WE IGNORE (Risk)

**Penalties:**
- ❌ Cannot pass security audit
- ❌ Cannot demonstrate compliance
- ❌ Performance degrades above 500 orgs
- ❌ Cannot debug production issues
- ❌ High risk of data loss

**Cost of Risk:** $100K+ (incident recovery, legal)

---

## Prioritization Matrix

```
                    LOW EFFORT               HIGH EFFORT
          ┌──────────────────────┬──────────────────────┐
    HIGH  │ QUICK WINS           │ STRATEGIC PROJECTS   │
  IMPACT  │ • Security headers   │ • Business tables    │
          │ • RLS fix            │ • API routes         │
          │ • Rate limiting      │ • Monitoring         │
          ├──────────────────────┼──────────────────────┤
    LOW   │ TRIVIAL              │ CONSIDER SKIPPING    │
  IMPACT  │ • Dark mode toggle   │ • Storybook          │
          │ • Developer guide    │ • GraphQL            │
          └──────────────────────┴──────────────────────┘
```

**QUICK WINS (Do First - 1 week):**
1. Fix RLS policy (30 min)
2. Add security headers (2d)
3. Setup monitoring (Sentry) (3d)

**MUST DO (Strategic - 8 weeks):**
1. API routes (80-100d)
2. Business tables (20d)
3. Audit logging (5d)
4. Frontend integration (25d)

---

## Conclusion

**Total Debt:** 47 items, 8-12 weeks to remediate

**Critical Path:** Fix RLS → Build API → Wire Frontend → Add Monitoring

**Go/No-Go Decision Points:**
- Week 2: Fix RLS, decide to continue
- Week 4: API routes 25% done, go/no-go
- Week 8: MVP feature complete, consider beta
- Week 12: Production ready

**Risk if Not Fixed:** Unable to launch, security vulnerabilities, data loss

---

**Report Generated:** 2026-06-30  
**Prepared By:** Architecture Review Board
