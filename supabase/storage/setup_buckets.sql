-- Supabase Storage Bucket Configuration
-- This script creates and configures storage buckets for file uploads
-- Created: 2026-06-29

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('avatars', 'avatars', NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Create organization logos bucket
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('organization-logos', 'organization-logos', NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('documents', 'documents', NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Create temp bucket
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('temp', 'temp', NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND
    (
      owner = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.avatar_url LIKE '%' || storage.objects.name || '%'
      )
    )
  );

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    owner = auth.uid()::text
  );

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    owner = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    owner = auth.uid()::text
  );

-- RLS policies for organization logos bucket
CREATE POLICY "org_logos_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'organization-logos' AND
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "org_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organization-logos' AND
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = auth.uid()
      AND u.organization_id::text = storage.objects.owner
    )
  );

CREATE POLICY "org_logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'organization-logos' AND
    owner = auth.uid()::text
  );

-- RLS policies for documents bucket
CREATE POLICY "documents_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.organization_id::text = storage.objects.owner
    )
  );

CREATE POLICY "documents_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.organization_id::text = storage.objects.owner
    )
  );

CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    owner = auth.uid()::text
  );

-- RLS policies for temp bucket
CREATE POLICY "temp_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'temp' AND
    owner = auth.uid()::text
  );

CREATE POLICY "temp_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'temp' AND
    owner = auth.uid()::text
  );

CREATE POLICY "temp_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'temp' AND
    owner = auth.uid()::text
  );
