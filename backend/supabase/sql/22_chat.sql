-- Feature: chat (buyer <-> seller)

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  order_id uuid references public.orders(id),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_unique_pair'
  ) then
    alter table public.conversations
      add constraint conversations_unique_pair unique (buyer_id, seller_id);
  end if;
end $$;

create index if not exists idx_conversations_buyer_id on public.conversations(buyer_id);
create index if not exists idx_conversations_seller_id on public.conversations(seller_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations: participants can select/insert
drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
on public.conversations
for select
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "conversations_insert_participants" on public.conversations;
create policy "conversations_insert_participants"
on public.conversations
for insert
to authenticated
with check (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
);

drop policy if exists "conversations_update_participants" on public.conversations;
create policy "conversations_update_participants"
on public.conversations
for update
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Messages: participants can select/insert
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (
        (c.buyer_id)::text = (auth.uid())::text
        or (c.seller_id)::text = (auth.uid())::text
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
      )
  )
);

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
on public.messages
for insert
to authenticated
with check (
  (sender_id)::text = (auth.uid())::text
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (
        (c.buyer_id)::text = (auth.uid())::text
        or (c.seller_id)::text = (auth.uid())::text
      )
  )
);

-- Realtime (optional): enable Postgres replication for messages & conversations
-- If this fails due to permissions, enable Realtime via Supabase Dashboard instead.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object then
      -- already added
      null;
    end;

    begin
      alter publication supabase_realtime add table public.conversations;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
