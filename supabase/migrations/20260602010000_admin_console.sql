-- Admin console authorization, audit ledger, and SMS review workflow.

do $$
begin
  create type public.admin_role as enum ('admin', 'super_admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sms_review_status as enum ('OPEN', 'REVIEWED', 'DISMISSED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_users (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) > 0),
  entity_type text not null check (length(trim(entity_type)) > 0),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.sms_failures
  add column if not exists review_status public.sms_review_status not null default 'OPEN',
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists admin_users_active_idx on public.admin_users (is_active, role);
create index if not exists admin_audit_events_created_at_idx on public.admin_audit_events (created_at desc);
create index if not exists admin_audit_events_actor_idx on public.admin_audit_events (actor_user_id);
create index if not exists sms_failures_review_status_idx on public.sms_failures (review_status, created_at desc);

alter table public.admin_users enable row level security;
alter table public.admin_audit_events enable row level security;

drop policy if exists service_admin_users_policy on public.admin_users;
create policy service_admin_users_policy on public.admin_users
  for all to service_role using (true) with check (true);

drop policy if exists service_admin_audit_events_policy on public.admin_audit_events;
create policy service_admin_audit_events_policy on public.admin_audit_events
  for all to service_role using (true) with check (true);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

comment on table public.admin_users is 'Supabase-authenticated users allowed to access the MaaSheba web admin console.';
comment on table public.admin_audit_events is 'Immutable-style audit ledger for admin console read/write actions.';
