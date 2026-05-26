create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chw_id uuid not null references public.chws(id) on delete restrict,
  mother_id uuid not null references public.mothers(id) on delete restrict,
  sender_type text not null check (sender_type in ('chw', 'mother')),
  sender_id uuid not null,
  message text not null check (length(trim(message)) > 0),
  message_type text not null default 'text' check (message_type in ('text', 'notification', 'alert')),
  category text check (category in ('জরুরি', 'স্বাভাবিক', 'পুষ্টি', 'সতর্কতা')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chw_id_idx on public.chat_messages(chw_id);
create index if not exists chat_messages_mother_id_idx on public.chat_messages(mother_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at desc);
create index if not exists chat_messages_is_read_idx on public.chat_messages(is_read) where is_read = false;
create index if not exists chat_messages_pair_created_idx on public.chat_messages(chw_id, mother_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chw_chat_policy" on public.chat_messages;
create policy "chw_chat_policy"
on public.chat_messages
for all
using (
  exists (
    select 1
    from public.chws c
    where c.id = chat_messages.chw_id
      and c.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.chws c
    where c.id = chat_messages.chw_id
      and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "mother_chat_policy" on public.chat_messages;
create policy "mother_chat_policy"
on public.chat_messages
for all
using (
  exists (
    select 1
    from public.mothers m
    where m.id = chat_messages.mother_id
      and m.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.mothers m
    where m.id = chat_messages.mother_id
      and m.auth_user_id = auth.uid()
  )
);

drop policy if exists "service_chat_policy" on public.chat_messages;
create policy "service_chat_policy"
on public.chat_messages
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
