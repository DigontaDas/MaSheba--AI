-- Migration: Fix Certificates Bucket Security
-- Set certificates bucket to public = false
UPDATE storage.buckets
SET public = false
WHERE id = 'certificates';

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Allow public read access to certificates" ON storage.objects;

-- Add new policy: only authenticated admins and the CHW who uploaded the file can read it
CREATE POLICY "Allow authenticated admins and owner read access to certificates" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE auth_user_id = auth.uid()
        AND is_active = true
      )
    )
  );
