-- Production Validation Sprint - critical gap found during live testing.
-- No RLS policy has ever existed on storage.objects for any bucket, in any
-- migration in this project's history (confirmed by grepping every file
-- under supabase/migrations/). The "documents" bucket itself exists
-- (created directly in the Supabase dashboard, not via a migration), but
-- with RLS enabled by default on storage.objects and zero policies, every
-- non-admin upload/download is denied outright (42501 / "new row violates
-- row-level security policy"), even for an Organization Owner with every
-- application-layer permission. This is confirmed live: POST /api/documents
-- and GET /api/documents/[id]/download|preview fail for every role, 100%
-- of the time, independent of the RBAC/organization-id checks the API
-- routes already perform correctly - the whole Documents module (POST
-- /api/documents, [id]/download, [id]/preview, [id]/replace, all under
-- src/app/api/documents/**) cannot actually move any bytes today.
--
-- Only "upload" (INSERT) and "download" (SELECT) are used anywhere in the
-- app (grepped src/app/api/documents/** - no .remove()/.update() calls
-- exist; [id]/replace uploads a new object at a new path rather than
-- overwriting the old one), so only INSERT and SELECT policies are added.
--
-- Every upload path in the app writes objects as
-- "{organization_id}/{entity_type}/{entity_id}/{timestamp}-{filename}"
-- (see src/app/api/documents/route.ts and .../[id]/replace/route.ts) -
-- storage.foldername(name) splits that path into segments, so segment [1]
-- is the organization_id. Reuses get_my_organization_id() (migration 013)
-- and user_has_permission() (migration 019), matching every other write
-- policy in this project.
--
-- Scoped to the "documents" bucket only, which is the only bucket any
-- application code references (grepped src/ for "avatars"/
-- "organization-logos"/"temp" - all three exist as buckets but are wired
-- into zero routes today; add matching policies if/when they're used).

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_bucket_select_with_permission" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_my_organization_id()::text
    AND public.user_has_permission('document.view')
  );

CREATE POLICY "documents_bucket_insert_with_permission" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_my_organization_id()::text
    AND public.user_has_permission('document.upload')
  );
