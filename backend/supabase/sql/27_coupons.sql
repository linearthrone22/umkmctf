-- Feature: coupons/vouchers (promo otomatis)
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade, -- null => global coupon
  code text not null unique,
  discount_type text not null, -- percent | fixed_per_kg | shipping_fixed
  amount numeric not null default 0,
  min_qty numeric not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coupons_discount_type_check') then
    alter table public.coupons
      add constraint coupons_discount_type_check
      check (discount_type in ('percent','fixed_per_kg','shipping_fixed'));
  end if;
end $$;

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_total numeric not null default 0;

update public.orders set discount_total = 0 where discount_total is null;

alter table public.coupons enable row level security;

-- Everyone can read active coupons (needed to validate a code); seller can read their own coupons
drop policy if exists "coupons_select_by_role" on public.coupons;
create policy "coupons_select_by_role"
on public.coupons
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or (seller_id)::text = (auth.uid())::text
  or (
    coalesce(is_active, true) = true
    and (valid_from is null or valid_from <= now())
    and (valid_to is null or valid_to >= now())
  )
);

drop policy if exists "coupons_insert_seller" on public.coupons;
create policy "coupons_insert_seller"
on public.coupons
for insert
to authenticated
with check (
  (seller_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
);

drop policy if exists "coupons_update_seller" on public.coupons;
create policy "coupons_update_seller"
on public.coupons
for update
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "coupons_delete_seller" on public.coupons;
create policy "coupons_delete_seller"
on public.coupons
for delete
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
