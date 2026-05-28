-- Feature: seller verification (KYC ringan) + badge
-- Safe to run multiple times.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists is_verified boolean not null default false;

create table if not exists public.seller_verifications (
  seller_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'draft', -- draft | submitted | approved | rejected
  doc_url text,
  note text,
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'seller_verifications_status_check') then
    alter table public.seller_verifications
      add constraint seller_verifications_status_check
      check (status in ('draft','submitted','approved','rejected'));
  end if;
end $$;

create or replace function public.seller_verifications_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_seller_verifications_set_updated_at on public.seller_verifications;
create trigger trg_seller_verifications_set_updated_at
before update on public.seller_verifications
for each row execute function public.seller_verifications_set_updated_at();

create or replace function public.seller_verifications_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = auth.uid();

  -- Seller can only submit (cannot approve/reject)
  if coalesce(v_role,'') <> 'admin' then
    if (new.seller_id)::text <> (auth.uid())::text then
      raise exception 'seller_id must match auth.uid()';
    end if;
    new.status := 'submitted';
    new.submitted_at := coalesce(new.submitted_at, now());
    new.decided_at := null;
    new.decided_by := null;
  else
    -- Admin sets decision
    if new.status in ('approved','rejected') and (old.status is distinct from new.status) then
      new.decided_at := coalesce(new.decided_at, now());
      new.decided_by := coalesce(new.decided_by, auth.uid());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_seller_verifications_guard_insert on public.seller_verifications;
create trigger trg_seller_verifications_guard_insert
before insert on public.seller_verifications
for each row execute function public.seller_verifications_guard();

drop trigger if exists trg_seller_verifications_guard_update on public.seller_verifications;
create trigger trg_seller_verifications_guard_update
before update on public.seller_verifications
for each row execute function public.seller_verifications_guard();

-- Keep profiles.is_verified in sync when admin decides
create or replace function public.seller_verifications_sync_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' then
    update public.profiles set is_verified = true where id = new.seller_id;
  elsif new.status = 'rejected' then
    update public.profiles set is_verified = false where id = new.seller_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_seller_verifications_sync_profile on public.seller_verifications;
create trigger trg_seller_verifications_sync_profile
after update on public.seller_verifications
for each row execute function public.seller_verifications_sync_profile();

alter table public.seller_verifications enable row level security;

drop policy if exists "seller_verifications_select_owner_or_admin" on public.seller_verifications;
create policy "seller_verifications_select_owner_or_admin"
on public.seller_verifications
for select
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "seller_verifications_upsert_seller" on public.seller_verifications;
create policy "seller_verifications_upsert_seller"
on public.seller_verifications
for insert
to authenticated
with check (
  (seller_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
);

drop policy if exists "seller_verifications_update_owner_or_admin" on public.seller_verifications;
create policy "seller_verifications_update_owner_or_admin"
on public.seller_verifications
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

