-- Feature: seller availability (pre-order, cutoff time, closed days, holidays)
-- Safe to run multiple times.

create table if not exists public.seller_availability (
  seller_id uuid primary key references public.profiles(id) on delete cascade,
  allows_preorder boolean not null default false,
  lead_days integer not null default 0,
  cutoff_time time,
  closed_weekdays integer[] not null default '{}', -- 0=Sun..6=Sat
  holidays date[] not null default '{}',
  timezone text not null default 'Asia/Jakarta',
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_seller_availability_touch on public.seller_availability;
create trigger trg_seller_availability_touch
before update on public.seller_availability
for each row execute function public.touch_updated_at();

alter table public.seller_availability enable row level security;

drop policy if exists "availability_select_public" on public.seller_availability;
create policy "availability_select_public"
on public.seller_availability
for select
to authenticated
using (true);

drop policy if exists "availability_upsert_self" on public.seller_availability;
create policy "availability_upsert_self"
on public.seller_availability
for insert
to authenticated
with check ((seller_id)::text = (auth.uid())::text);

drop policy if exists "availability_update_self" on public.seller_availability;
create policy "availability_update_self"
on public.seller_availability
for update
to authenticated
using ((seller_id)::text = (auth.uid())::text)
with check ((seller_id)::text = (auth.uid())::text);

