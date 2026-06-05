-- Migration: Add Mother Verification & LMP columns
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS chw_email TEXT;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS chw_phone TEXT;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS lmp_date DATE;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'));

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS lmp_date DATE;

-- Indexes for search speed
CREATE INDEX IF NOT EXISTS mothers_chw_email_idx ON public.mothers(chw_email);
CREATE INDEX IF NOT EXISTS mothers_chw_phone_idx ON public.mothers(chw_phone);
CREATE INDEX IF NOT EXISTS mothers_verification_status_idx ON public.mothers(verification_status);

-- RLS Updates
DROP POLICY IF EXISTS "chw_select_pending_mothers" ON public.mothers;
CREATE POLICY "chw_select_pending_mothers" ON public.mothers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chws
      WHERE public.chws.auth_user_id = auth.uid()
      AND public.chws.is_active = true
    )
  );

DROP POLICY IF EXISTS "chw_update_pending_mothers" ON public.mothers;
CREATE POLICY "chw_update_pending_mothers" ON public.mothers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chws
      WHERE public.chws.auth_user_id = auth.uid()
      AND public.chws.is_active = true
    )
  );

-- Create Storage bucket for certificates if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the certificates bucket
DROP POLICY IF EXISTS "Allow public read access to certificates" ON storage.objects;
CREATE POLICY "Allow public read access to certificates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Allow authenticated upload of certificates" ON storage.objects;
CREATE POLICY "Allow authenticated upload of certificates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');
