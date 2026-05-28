-- Core schema for DirectRoute AI marketplace (Supabase Postgres)
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

create extension if not exists pgcrypto;

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key,
  username text not null,
  role text not null default 'buyer',
  location text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists role text;

alter table public.profiles
  add column if not exists location text;

alter table public.profiles
  add column if not exists created_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('buyer','seller','admin'));
  end if;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    coalesce(new.raw_user_meta_data->>'location', '')
  )
  on conflict (id) do update
    set username = excluded.username,
        role = excluded.role,
        location = excluded.location;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ITEMS (seller inventory)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id),
  umkm_name text not null default '',
  commodity text not null,
  price numeric not null default 0,
  stock numeric not null default 0,
  location text not null default '',
  image_url text not null default '',
  is_active boolean not null default true,
  category text,
  discount_per_kg numeric not null default 0,
  min_stock numeric not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists idx_items_seller_id on public.items(seller_id);
create index if not exists idx_items_active on public.items(is_active);

-- Backfill / ensure new columns exist (for projects that already had `public.items`)
alter table public.items add column if not exists umkm_name text;
alter table public.items add column if not exists image_url text;
alter table public.items add column if not exists is_active boolean;
alter table public.items add column if not exists category text;
alter table public.items add column if not exists discount_per_kg numeric;
alter table public.items add column if not exists min_stock numeric;
alter table public.items add column if not exists created_at timestamptz;

-- Defaults for existing rows
update public.items set discount_per_kg = coalesce(discount_per_kg, 0) where discount_per_kg is null;
update public.items set min_stock = coalesce(min_stock, 10) where min_stock is null;
update public.items set is_active = coalesce(is_active, true) where is_active is null;

-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  item_id uuid not null references public.items(id),
  quantity numeric not null default 1,
  total_price numeric not null default 0,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  shipping_address_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_buyer_id on public.orders(buyer_id);
create index if not exists idx_orders_seller_id on public.orders(seller_id);
create index if not exists idx_orders_status on public.orders(status);

-- Backfill / ensure new columns exist
alter table public.orders add column if not exists payment_status text;
alter table public.orders add column if not exists shipping_address_id uuid;
alter table public.orders add column if not exists notes text;

-- SHIPMENTS (AI logistics history)
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id),
  route_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipments_seller_id on public.shipments(seller_id);
