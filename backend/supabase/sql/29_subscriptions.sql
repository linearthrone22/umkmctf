-- Feature: subscriptions / repeat order
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity numeric not null default 1,
  frequency text not null default 'weekly', -- weekly | biweekly | monthly
  day_of_week integer, -- 0..6 (optional)
  day_of_month integer, -- 1..31 (optional)
  next_run_at timestamptz,
  is_active boolean not null default true,
  shipping_address_id uuid,
  notes text,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_frequency_check') then
    alter table public.subscriptions
      add constraint subscriptions_frequency_check
      check (frequency in ('weekly','biweekly','monthly'));
  end if;
end $$;

create index if not exists idx_subscriptions_buyer_id on public.subscriptions(buyer_id);
create index if not exists idx_subscriptions_item_id on public.subscriptions(item_id);

drop trigger if exists trg_subscriptions_touch on public.subscriptions;
create trigger trg_subscriptions_touch
before update on public.subscriptions
for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_self" on public.subscriptions;
create policy "subscriptions_select_self"
on public.subscriptions
for select
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "subscriptions_insert_self" on public.subscriptions;
create policy "subscriptions_insert_self"
on public.subscriptions
for insert
to authenticated
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "subscriptions_update_self" on public.subscriptions;
create policy "subscriptions_update_self"
on public.subscriptions
for update
to authenticated
using ((buyer_id)::text = (auth.uid())::text)
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "subscriptions_delete_self" on public.subscriptions;
create policy "subscriptions_delete_self"
on public.subscriptions
for delete
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

-- Helper: manually create an order from a subscription (MVP, no cron)
create or replace function public.create_order_from_subscription(p_subscription_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_order_id uuid;
  v_seller_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated';
  end if;

  select * into v_sub
  from public.subscriptions s
  where s.id = p_subscription_id
    and (s.buyer_id)::text = (auth.uid())::text
    and coalesce(s.is_active, true) = true;

  if not found then
    raise exception 'Subscription tidak ditemukan atau tidak aktif';
  end if;

  select i.seller_id into v_seller_id
  from public.items i
  where i.id = v_sub.item_id;

  if v_seller_id is null then
    raise exception 'Seller item tidak ditemukan';
  end if;

  insert into public.orders (
    buyer_id, seller_id, item_id, quantity, status,
    shipping_address_id, notes, coupon_code
  )
  values (
    auth.uid(), v_seller_id, v_sub.item_id, v_sub.quantity, 'pending',
    v_sub.shipping_address_id, v_sub.notes, v_sub.coupon_code
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

