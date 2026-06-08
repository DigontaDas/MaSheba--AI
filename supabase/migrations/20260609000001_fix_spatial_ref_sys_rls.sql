-- Fix Supabase linter warning: "RLS Disabled in Public" on public.spatial_ref_sys
--
-- spatial_ref_sys is owned by the PostGIS extension and cannot have RLS enabled
-- by the migration role (non-superuser). The correct mitigation is to revoke
-- PostgREST client roles from accessing the table directly. This prevents
-- the table from being queryable via the API even without RLS.
--
-- NOTE: If this still fails due to ownership, run these two lines manually in the
-- Supabase Dashboard SQL editor (it runs as the postgres superuser):
--
--   REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;
--   ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Attempt to revoke client access (may still need superuser for ENABLE ROW LEVEL SECURITY)
  EXECUTE 'REVOKE ALL ON public.spatial_ref_sys FROM anon';
  EXECUTE 'REVOKE ALL ON public.spatial_ref_sys FROM authenticated';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Could not revoke spatial_ref_sys grants — run manually as postgres superuser.';
END;
$$;
