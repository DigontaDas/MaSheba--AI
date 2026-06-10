-- PostGIS creates public.spatial_ref_sys when the extension is installed in
-- the public schema. Supabase exposes public through PostgREST, so the linter
-- requires RLS on this extension metadata table as well.
--
-- No policies are added: app clients should not query this table directly.
-- PostGIS internals and service/admin roles can still operate normally.

do $$
begin
  if to_regclass('public.spatial_ref_sys') is not null then
    revoke all on table public.spatial_ref_sys from anon;
    revoke all on table public.spatial_ref_sys from authenticated;
    alter table public.spatial_ref_sys enable row level security;
  end if;
end;
$$;
