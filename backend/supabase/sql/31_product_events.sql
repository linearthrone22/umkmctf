-- Feature: product events for analytics (views/clicks/add_to_cart/checkout)
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,
  item_id uuid not null references public.items(id) on delete cascade,
  event_type text not null, -- view | click | add_to_cart | checkout
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_events_type_check') then
    alter table public.product_events
      add constraint product_events_type_check
      check (event_type in ('view','click','add_to_cart','checkout'));
  end if;
end $$;

create index if not exists idx_product_events_item_id on public.product_events(item_id);
create index if not exists idx_product_events_created_at on public.product_events(created_at);

alter table public.product_events enable row level security;

-- Buyers can insert their own events
drop policy if exists "product_events_insert_buyer" on public.product_events;
create policy "product_events_insert_buyer"
on public.product_events
for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
  and (buyer_id is null or (buyer_id)::text = (auth.uid())::text)
);

-- Sellers can read events for their items; buyers can read their own events; admin can read all
drop policy if exists "product_events_select_role" on public.product_events;
create policy "product_events_select_role"
on public.product_events
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or (buyer_id is not null and (buyer_id)::text = (auth.uid())::text)
  or exists (
    select 1 from public.items i
    where i.id = product_events.item_id
      and (i.seller_id)::text = (auth.uid())::text
  )
);

