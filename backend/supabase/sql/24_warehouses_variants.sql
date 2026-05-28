-- Feature: seller warehouses + product variants via extra columns on `public.items`
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  location text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_warehouses_seller_id on public.warehouses(seller_id);

-- Add variant + warehouse columns to items (variants are represented as separate item rows)
alter table public.items add column if not exists sku text;
alter table public.items add column if not exists variant_grade text;
alter table public.items add column if not exists variant_size text;
alter table public.items add column if not exists variant_packaging text;
alter table public.items add column if not exists warehouse_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'items_warehouse_id_fkey'
  ) then
    alter table public.items
      add constraint items_warehouse_id_fkey
      foreign key (warehouse_id) references public.warehouses(id) on delete set null;
  end if;
end $$;

-- RLS: warehouses
alter table public.warehouses enable row level security;

drop policy if exists "warehouses_select_by_role" on public.warehouses;
create policy "warehouses_select_by_role"
on public.warehouses
for select
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "warehouses_insert_own_seller" on public.warehouses;
create policy "warehouses_insert_own_seller"
on public.warehouses
for insert
to authenticated
with check (
  (seller_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
);

drop policy if exists "warehouses_update_own_seller" on public.warehouses;
create policy "warehouses_update_own_seller"
on public.warehouses
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

drop policy if exists "warehouses_delete_own_seller" on public.warehouses;
create policy "warehouses_delete_own_seller"
on public.warehouses
for delete
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

