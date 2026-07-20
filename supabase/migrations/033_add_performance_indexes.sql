-- Performance Hardening Sprint 2 - Part 5 (Database)
-- Adds composite indexes matching query shapes confirmed in the API route
-- audit (see the Sprint 2 report for the specific routes each one backs).
-- Every high-traffic list/report route filters `organization_id` together
-- with `is_deleted = false` and then a date column (`.gte()`/`.lte()`) or
-- sorts by one - none of the existing composite indexes from migration
-- 011 include `is_deleted`, so those queries fall back to scanning the
-- organization_id index and re-checking is_deleted/date per row instead of
-- using a single covering index. This migration is additive only (no
-- column/table changes) and is NOT applied automatically - the client
-- applies migrations themselves, same as every prior migration in this
-- project.

-- invoices: GET /api/billing/invoices, reports/financial, reports/clients,
-- billing/summary all filter organization_id + is_deleted, then range or
-- sort on invoice_date; the invoice list additionally sorts by created_at
-- when unfiltered.
CREATE INDEX IF NOT EXISTS idx_invoices_org_deleted_invoice_date
  ON invoices(organization_id, is_deleted, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_org_deleted_created_at
  ON invoices(organization_id, is_deleted, created_at);

-- payments: GET /api/billing/payments and reports/financial filter
-- organization_id + is_deleted and sort/range on payment_date. Previously
-- only single-column indexes existed on this table.
CREATE INDEX IF NOT EXISTS idx_payments_org_deleted_payment_date
  ON payments(organization_id, is_deleted, payment_date);

-- scheduled_visits: is_deleted is filtered on nearly every route touching
-- this table (visits list, dashboard, conflicts, reports/operational) but
-- wasn't part of any existing composite from migration 011.
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_org_deleted_date
  ON scheduled_visits(organization_id, is_deleted, scheduled_date);

-- timesheets: billing/summary and reports/branch filter
-- organization_id + is_deleted + visit_date; the from-visits batch
-- existence check (see billing-engine.ts) filters organization_id +
-- is_deleted alone. Existing composites required employee_id or
-- is_billed equality to be useful for these.
CREATE INDEX IF NOT EXISTS idx_timesheets_org_deleted_visit_date
  ON timesheets(organization_id, is_deleted, visit_date);

-- client_billing_overrides / municipality_contracts: back the per-visit
-- rate-resolution lookups in billing-engine.ts::resolveBillingRules. That
-- N+1 chain itself is now cached per request (see billing-engine.ts), so
-- this is a secondary win - the query still runs at least once per
-- distinct client/branch/date combination in a billing run and only had
-- single-column indexes before.
CREATE INDEX IF NOT EXISTS idx_client_billing_overrides_client_active_deleted
  ON client_billing_overrides(client_id, is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_municipality_contracts_branch_org_active_deleted_start
  ON municipality_contracts(branch_id, organization_id, is_active, is_deleted, start_date);
