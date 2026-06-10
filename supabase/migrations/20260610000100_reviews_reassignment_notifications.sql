create table if not exists public.chw_reviews (
  id uuid primary key default gen_random_uuid(),
  mother_id uuid not null references public.mothers(id) on delete cascade,
  chw_id uuid not null references public.chws(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text check (review_text is null or char_length(review_text) <= 300),
  status text not null default 'active' check (status in ('active', 'flagged', 'removed')),
  moderation_reason text check (moderation_reason is null or char_length(moderation_reason) <= 500),
  moderated_by uuid,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mother_id, chw_id)
);

create index if not exists chw_reviews_chw_status_created_idx
  on public.chw_reviews(chw_id, status, created_at desc);
create index if not exists chw_reviews_mother_chw_idx
  on public.chw_reviews(mother_id, chw_id);

drop trigger if exists chw_reviews_set_updated_at on public.chw_reviews;
create trigger chw_reviews_set_updated_at
before update on public.chw_reviews
for each row
execute function public.set_updated_at();

alter table public.chw_reviews enable row level security;

drop policy if exists "mothers_select_own_chw_reviews" on public.chw_reviews;
create policy "mothers_select_own_chw_reviews"
on public.chw_reviews
for select
to authenticated
using (
  exists (
    select 1 from public.mothers m
    where m.id = chw_reviews.mother_id
      and m.auth_user_id = auth.uid()
  )
);

drop policy if exists "mothers_insert_own_current_chw_reviews" on public.chw_reviews;
create policy "mothers_insert_own_current_chw_reviews"
on public.chw_reviews
for insert
to authenticated
with check (
  status = 'active'
  and moderation_reason is null
  and moderated_by is null
  and moderated_at is null
  and exists (
    select 1
    from public.mothers m
    join public.patients p on p.id = m.patient_id
    where m.id = chw_reviews.mother_id
      and m.auth_user_id = auth.uid()
      and p.chw_id = chw_reviews.chw_id
  )
);

drop policy if exists "mothers_update_own_current_chw_reviews" on public.chw_reviews;
create policy "mothers_update_own_current_chw_reviews"
on public.chw_reviews
for update
to authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.mothers m
    where m.id = chw_reviews.mother_id
      and m.auth_user_id = auth.uid()
  )
)
with check (
  status = 'active'
  and moderation_reason is null
  and moderated_by is null
  and moderated_at is null
  and exists (
    select 1
    from public.mothers m
    join public.patients p on p.id = m.patient_id
    where m.id = chw_reviews.mother_id
      and m.auth_user_id = auth.uid()
      and p.chw_id = chw_reviews.chw_id
  )
);

drop policy if exists "chws_select_reviews_for_self" on public.chw_reviews;
create policy "chws_select_reviews_for_self"
on public.chw_reviews
for select
to authenticated
using (
  status <> 'removed'
  and exists (
    select 1 from public.chws c
    where c.id = chw_reviews.chw_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "service_role_manage_chw_reviews" on public.chw_reviews;
create policy "service_role_manage_chw_reviews"
on public.chw_reviews
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace view public.v_chw_review_summary as
select
  c.id as chw_id,
  c.name as chw_name,
  coalesce(round(avg(r.rating)::numeric, 2), 0)::numeric(3,2) as average_rating,
  count(r.id)::integer as review_count
from public.chws c
left join public.chw_reviews r on r.chw_id = c.id and r.status = 'active'
group by c.id, c.name;

create table if not exists public.chw_reassignment_requests (
  id uuid primary key default gen_random_uuid(),
  mother_id uuid not null references public.mothers(id) on delete cascade,
  current_chw_id uuid references public.chws(id) on delete set null,
  requested_chw_id uuid references public.chws(id) on delete set null,
  reason text not null check (reason in ('not_responding', 'moved_area', 'other')),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'dismissed', 'cancelled')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists chw_reassignment_one_pending_per_mother_uidx
  on public.chw_reassignment_requests(mother_id)
  where status = 'pending';
create index if not exists chw_reassignment_status_created_idx
  on public.chw_reassignment_requests(status, created_at asc);
create index if not exists chw_reassignment_current_chw_status_idx
  on public.chw_reassignment_requests(current_chw_id, status);

drop trigger if exists chw_reassignment_requests_set_updated_at on public.chw_reassignment_requests;
create trigger chw_reassignment_requests_set_updated_at
before update on public.chw_reassignment_requests
for each row
execute function public.set_updated_at();

alter table public.chw_reassignment_requests enable row level security;

drop policy if exists "mothers_select_own_reassignment_requests" on public.chw_reassignment_requests;
create policy "mothers_select_own_reassignment_requests"
on public.chw_reassignment_requests
for select
to authenticated
using (
  exists (
    select 1 from public.mothers m
    where m.id = chw_reassignment_requests.mother_id
      and m.auth_user_id = auth.uid()
  )
);

drop policy if exists "mothers_insert_own_reassignment_requests" on public.chw_reassignment_requests;
create policy "mothers_insert_own_reassignment_requests"
on public.chw_reassignment_requests
for insert
to authenticated
with check (
  status = 'pending'
  and requested_chw_id is null
  and resolved_by is null
  and resolved_at is null
  and exists (
    select 1
    from public.mothers m
    left join public.patients p on p.id = m.patient_id
    where m.id = chw_reassignment_requests.mother_id
      and m.auth_user_id = auth.uid()
      and (
        chw_reassignment_requests.current_chw_id is null
        or p.chw_id = chw_reassignment_requests.current_chw_id
      )
  )
);

drop policy if exists "service_role_manage_reassignment_requests" on public.chw_reassignment_requests;
create policy "service_role_manage_reassignment_requests"
on public.chw_reassignment_requests
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('mother', 'chw', 'admin')),
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_id text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id, expo_push_token)
);

create index if not exists notification_devices_user_enabled_idx
  on public.notification_devices(auth_user_id, enabled);

drop trigger if exists notification_devices_set_updated_at on public.notification_devices;
create trigger notification_devices_set_updated_at
before update on public.notification_devices
for each row
execute function public.set_updated_at();

alter table public.notification_devices enable row level security;

drop policy if exists "users_manage_own_notification_devices" on public.notification_devices;
create policy "users_manage_own_notification_devices"
on public.notification_devices
for all
to authenticated
using (auth.uid() = auth_user_id)
with check (
  auth.uid() = auth_user_id
  and (
    (
      role = 'mother'
      and exists (
        select 1
        from public.mothers m
        where m.auth_user_id = auth.uid()
      )
    )
    or (
      role = 'chw'
      and exists (
        select 1
        from public.chws c
        where c.auth_user_id = auth.uid()
      )
    )
    or (
      role = 'admin'
      and exists (
        select 1
        from public.admin_users au
        where au.auth_user_id = auth.uid()
          and coalesce(au.is_active, true)
      )
    )
  )
);

drop policy if exists "service_role_manage_notification_devices" on public.notification_devices;
create policy "service_role_manage_notification_devices"
on public.notification_devices
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_role text not null check (recipient_role in ('mother', 'chw', 'admin')),
  event_type text not null,
  title text not null check (length(trim(title)) > 0 and char_length(title) <= 120),
  body text not null check (length(trim(body)) > 0 and char_length(body) <= 500),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'read')),
  provider_response jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_events_recipient_created_idx
  on public.notification_events(recipient_user_id, created_at desc);
create index if not exists notification_events_status_created_idx
  on public.notification_events(status, created_at asc);

alter table public.notification_events enable row level security;

drop policy if exists "users_read_own_notification_events" on public.notification_events;
create policy "users_read_own_notification_events"
on public.notification_events
for select
to authenticated
using (auth.uid() = recipient_user_id);

drop policy if exists "users_mark_own_notification_events_read" on public.notification_events;

drop policy if exists "service_role_manage_notification_events" on public.notification_events;
create policy "service_role_manage_notification_events"
on public.notification_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.enqueue_notification_event(
  recipient_user_id uuid,
  recipient_role text,
  event_type text,
  title text,
  body text,
  data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if recipient_user_id is null then
    return;
  end if;

  insert into public.notification_events (
    recipient_user_id,
    recipient_role,
    event_type,
    title,
    body,
    data
  )
  values (
    recipient_user_id,
    recipient_role,
    event_type,
    title,
    body,
    coalesce(data, '{}'::jsonb)
  );
end;
$$;

create or replace function public.enqueue_chat_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
  recipient_role text;
begin
  if new.sender_type = 'chw' then
    select m.auth_user_id into recipient_user_id
    from public.mothers m
    where m.id = new.mother_id;
    recipient_role := 'mother';
  else
    select c.auth_user_id into recipient_user_id
    from public.chws c
    where c.id = new.chw_id;
    recipient_role := 'chw';
  end if;

  perform public.enqueue_notification_event(
    recipient_user_id,
    recipient_role,
    'chat_message',
    'নতুন বার্তা',
    left(new.message, 160),
    jsonb_build_object('chat_message_id', new.id, 'chw_id', new.chw_id, 'mother_id', new.mother_id)
  );
  return new;
end;
$$;

drop trigger if exists enqueue_chat_message_notification on public.chat_messages;
create trigger enqueue_chat_message_notification
after insert on public.chat_messages
for each row
execute function public.enqueue_chat_message_notification();

create or replace function public.enqueue_connection_request_admin_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_row record;
begin
  for admin_row in
    select auth_user_id
    from public.admin_users
    where is_active = true
  loop
    perform public.enqueue_notification_event(
      admin_row.auth_user_id,
      'admin',
      'connection_request',
      'New connection request',
      'A mother requested CHW assignment.',
      jsonb_build_object('connection_request_id', new.id, 'mother_id', new.mother_id)
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists enqueue_connection_request_admin_notification on public.connection_requests;
create trigger enqueue_connection_request_admin_notification
after insert on public.connection_requests
for each row
execute function public.enqueue_connection_request_admin_notification();

create or replace function public.enqueue_reassignment_admin_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_row record;
begin
  for admin_row in
    select auth_user_id
    from public.admin_users
    where is_active = true
  loop
    perform public.enqueue_notification_event(
      admin_row.auth_user_id,
      'admin',
      'chw_reassignment_request',
      'New CHW reassignment request',
      'A mother requested a new health worker.',
      jsonb_build_object('reassignment_request_id', new.id, 'mother_id', new.mother_id)
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists enqueue_reassignment_admin_notification on public.chw_reassignment_requests;
create trigger enqueue_reassignment_admin_notification
after insert on public.chw_reassignment_requests
for each row
execute function public.enqueue_reassignment_admin_notification();

create or replace function public.enqueue_high_risk_chw_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
begin
  if new.risk_level <> 'HIGH' then
    return new;
  end if;

  select c.auth_user_id into recipient_user_id
  from public.chws c
  where c.id = new.chw_id;

  perform public.enqueue_notification_event(
    recipient_user_id,
    'chw',
    'high_risk_visit',
    'High risk alert',
    'A mother has a HIGH risk assessment result.',
    jsonb_build_object('visit_id', new.id, 'patient_id', new.patient_id, 'chw_id', new.chw_id)
  );
  return new;
end;
$$;

drop trigger if exists enqueue_high_risk_chw_notification on public.visits;
create trigger enqueue_high_risk_chw_notification
after insert on public.visits
for each row
execute function public.enqueue_high_risk_chw_notification();

create or replace function public.enqueue_chw_approval_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status = 'APPROVED'
    and (old.verification_status is distinct from new.verification_status)
  then
    perform public.enqueue_notification_event(
      new.auth_user_id,
      'chw',
      'chw_approved',
      'CHW account approved',
      'Your MaaSheba CHW account has been approved.',
      jsonb_build_object('chw_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists enqueue_chw_approval_notification on public.chws;
create trigger enqueue_chw_approval_notification
after update of verification_status on public.chws
for each row
execute function public.enqueue_chw_approval_notification();

grant execute on function public.enqueue_notification_event(uuid, text, text, text, text, jsonb) to service_role;
