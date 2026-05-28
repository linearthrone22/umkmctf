-- Feature: saved carts (buyer can save/load cart)
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.saved_carts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  cart jsonb not null, -- { lines: [{ item_id, quantity }], notes?, coupon_code? }
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_saved_carts_buyer_id on public.saved_carts(buyer_id);

drop trigger if exists trg_saved_carts_touch on public.saved_carts;
create trigger trg_saved_carts_touch
before update on public.saved_carts
for each row execute function public.touch_updated_at();

alter table public.saved_carts enable row level security;

drop policy if exists "saved_carts_select_self" on public.saved_carts;
create policy "saved_carts_select_self"
on public.saved_carts
for select
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "saved_carts_insert_self" on public.saved_carts;
create policy "saved_carts_insert_self"
on public.saved_carts
for insert
to authenticated
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "saved_carts_update_self" on public.saved_carts;
create policy "saved_carts_update_self"
on public.saved_carts
for update
to authenticated
using ((buyer_id)::text = (auth.uid())::text)
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "saved_carts_delete_self" on public.saved_carts;
create policy "saved_carts_delete_self"
on public.saved_carts
for delete
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

