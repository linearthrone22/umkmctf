-- Feature: CMS kategori/komoditas + banner promo homepage
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.marketplace_categories enable row level security;
alter table public.promo_banners enable row level security;

-- Read: all authenticated
drop policy if exists "marketplace_categories_select_all" on public.marketplace_categories;
create policy "marketplace_categories_select_all"
on public.marketplace_categories
for select
to anon, authenticated
using (true);

drop policy if exists "promo_banners_select_all" on public.promo_banners;
create policy "promo_banners_select_all"
on public.promo_banners
for select
to anon, authenticated
using (true);

-- Write: admin only
drop policy if exists "marketplace_categories_write_admin" on public.marketplace_categories;
create policy "marketplace_categories_write_admin"
on public.marketplace_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "promo_banners_write_admin" on public.promo_banners;
create policy "promo_banners_write_admin"
on public.promo_banners
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
