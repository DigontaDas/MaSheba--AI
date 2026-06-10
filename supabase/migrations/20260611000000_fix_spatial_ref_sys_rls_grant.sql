-- Migration: Fix spatial_ref_sys RLS for client queries
DO $$
BEGIN
  EXECUTE 'GRANT SELECT ON public.spatial_ref_sys TO authenticated';
  EXECUTE 'GRANT SELECT ON public.spatial_ref_sys TO anon';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not grant SELECT on spatial_ref_sys — run manually as postgres superuser.';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_select_spatial_ref_sys" ON public.spatial_ref_sys';
    EXECUTE 'CREATE POLICY "allow_select_spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT TO public USING (true)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create policy on spatial_ref_sys — run manually as postgres superuser.';
END $$;
