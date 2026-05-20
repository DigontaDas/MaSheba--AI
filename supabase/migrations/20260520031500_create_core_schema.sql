create extension if not exists "pgcrypto";

do $$
begin
  create type public.risk_level as enum ('LOW', 'MODERATE', 'HIGH');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.outbox_status as enum ('PENDING', 'SYNCED', 'DUPLICATE', 'FAILED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.chws (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  union_name text not null check (length(trim(union_name)) > 0),
  upazila text not null check (length(trim(upazila)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  chw_id uuid not null references public.chws(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  age integer not null check (age between 10 and 60),
  gestational_age_weeks integer not null check (gestational_age_weeks between 1 and 45),
  last_risk_level public.risk_level not null default 'LOW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_id_chw_id_key unique (id, chw_id)
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  chw_id uuid not null references public.chws(id) on delete restrict,
  bp_systolic integer not null check (bp_systolic between 60 and 260),
  bp_diastolic integer not null check (bp_diastolic between 30 and 180),
  weight_kg numeric(5,2) not null check (weight_kg between 25 and 200),
  hemoglobin numeric(4,1) not null check (hemoglobin between 3 and 20),
  swelling_present boolean not null default false,
  symptom_flags jsonb not null default '{}'::jsonb,
  risk_level public.risk_level not null,
  visited_at timestamptz not null,
  device_id text not null check (length(trim(device_id)) > 0),
  created_at timestamptz not null default now(),
  constraint visits_patient_chw_consistency foreign key (patient_id, chw_id)
    references public.patients(id, chw_id)
);

create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (length(trim(idempotency_key)) > 0),
  chw_id uuid not null references public.chws(id) on delete restrict,
  device_id text not null check (length(trim(device_id)) > 0),
  event_type text not null check (event_type in ('patient_upsert', 'visit_create')),
  payload jsonb not null,
  status public.outbox_status not null default 'PENDING',
  error_message text,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create index if not exists patients_chw_id_idx on public.patients (chw_id);
create index if not exists patients_risk_level_idx on public.patients (last_risk_level);
create index if not exists visits_chw_id_idx on public.visits (chw_id);
create index if not exists visits_visited_at_idx on public.visits (visited_at desc);
create index if not exists outbox_events_chw_id_idx on public.outbox_events (chw_id);
create index if not exists outbox_events_status_idx on public.outbox_events (status);
create unique index if not exists outbox_events_idempotency_key_uidx on public.outbox_events (idempotency_key);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
before update on public.patients
for each row
execute function public.set_updated_at();
