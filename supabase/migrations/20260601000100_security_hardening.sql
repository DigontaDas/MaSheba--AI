-- 1. Rebuild database views with security_invoker = true to enforce RLS constraints during execution
drop view if exists public.v_chw_list cascade;
drop view if exists public.v_risk_summary cascade;

create or replace view public.v_chw_list
with (security_invoker = true)
as
select
  c.id as chw_id,
  c.name,
  c.union_name,
  c.upazila,
  c.is_active,
  count(p.id)::integer as patient_count
from public.chws c
left join public.patients p on p.chw_id = c.id
group by c.id, c.name, c.union_name, c.upazila, c.is_active;

create or replace view public.v_risk_summary
with (security_invoker = true)
as
select
  c.id as chw_id,
  c.name as chw_name,
  count(p.id) filter (where p.last_risk_level = 'LOW')::integer as low_count,
  count(p.id) filter (where p.last_risk_level = 'MODERATE')::integer as moderate_count,
  count(p.id) filter (where p.last_risk_level = 'HIGH')::integer as high_count
from public.chws c
left join public.patients p on p.chw_id = c.id
group by c.id, c.name;

-- Re-establish admin privileges on the rebuilt security-invoking views
grant select on public.v_chw_list to service_role, maasheba_admin;
grant select on public.v_risk_summary to service_role, maasheba_admin;

-- 2. Restrict execute permissions on sensitive security definer functions
-- Revoke from PUBLIC (which covers anon and authenticated roles implicitly by default) and explicitly authorize only needed roles

-- current_chw_id (needed by active CHW client sessions to evaluate RLS filters)
revoke execute on function public.current_chw_id() from public;
grant execute on function public.current_chw_id() to authenticated, service_role;

-- process_outbox_batch (restricted exclusively to the backend service role running edge syncs)
revoke execute on function public.process_outbox_batch(jsonb) from public;
grant execute on function public.process_outbox_batch(jsonb) to service_role;

-- rls_auto_enable (defensively revoke if active on the live project)
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public';
  end if;
end $$;

-- 3. Replace insecure broad select policy on public.mothers table with granular row isolation
-- Clean drop of existing select policies to ensure idempotency
drop policy if exists "mothers_select_policy" on public.mothers;
drop policy if exists "mothers_select_own" on public.mothers;

-- Establish scoped select rules
create policy "mothers_select_policy"
on public.mothers
for select
to authenticated
using (
  -- A mother can read only her own account profile
  auth.uid() = auth_user_id
  or
  -- A Community Health Worker (CHW) can read profile data for mothers assigned to their active patients
  exists (
    select 1
    from public.patients p
    where p.id = public.mothers.patient_id
      and p.chw_id = public.current_chw_id()
  )
);
