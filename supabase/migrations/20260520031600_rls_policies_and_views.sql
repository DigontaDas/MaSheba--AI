alter table public.chws enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.outbox_events enable row level security;

do $$
begin
  create role maasheba_admin;
exception
  when duplicate_object then null;
end $$;

create or replace function public.current_chw_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.chws c
  where c.auth_user_id = auth.uid()
    and c.is_active = true
  limit 1
$$;

drop policy if exists "chws select own row" on public.chws;
create policy "chws select own row"
on public.chws
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "chws update own row" on public.chws;
create policy "chws update own row"
on public.chws
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "patients select own chw records" on public.patients;
create policy "patients select own chw records"
on public.patients
for select
to authenticated
using (chw_id = public.current_chw_id());

drop policy if exists "patients insert own chw records" on public.patients;
create policy "patients insert own chw records"
on public.patients
for insert
to authenticated
with check (chw_id = public.current_chw_id());

drop policy if exists "patients update own chw records" on public.patients;
create policy "patients update own chw records"
on public.patients
for update
to authenticated
using (chw_id = public.current_chw_id())
with check (chw_id = public.current_chw_id());

drop policy if exists "visits select own chw records" on public.visits;
create policy "visits select own chw records"
on public.visits
for select
to authenticated
using (chw_id = public.current_chw_id());

drop policy if exists "visits insert own chw records" on public.visits;
create policy "visits insert own chw records"
on public.visits
for insert
to authenticated
with check (chw_id = public.current_chw_id());

drop policy if exists "outbox insert own chw records" on public.outbox_events;
create policy "outbox insert own chw records"
on public.outbox_events
for insert
to authenticated
with check (chw_id = public.current_chw_id());

create or replace view public.v_chw_list
with (security_invoker = false)
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
with (security_invoker = false)
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

grant usage on schema public to maasheba_admin;
grant select on public.v_chw_list to service_role, maasheba_admin;
grant select on public.v_risk_summary to service_role, maasheba_admin;
grant execute on function public.current_chw_id() to authenticated, service_role;

comment on view public.v_chw_list is 'Admin view: CHW roster with patient counts.';
comment on view public.v_risk_summary is 'Admin view: patient risk counts grouped by CHW.';
