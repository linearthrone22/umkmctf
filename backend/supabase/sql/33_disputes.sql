-- Feature: dispute center (buyer complain -> seller respond -> admin decide)
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null default 'Komplain pesanan',
  buyer_message text not null,
  seller_response text,
  admin_decision text,
  admin_note text,
  status text not null default 'open', -- open | waiting_admin | resolved | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_disputes_order_id on public.disputes(order_id);
create index if not exists idx_disputes_buyer_id on public.disputes(buyer_id);
create index if not exists idx_disputes_seller_id on public.disputes(seller_id);
create index if not exists idx_disputes_status on public.disputes(status);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'disputes_status_check') then
    alter table public.disputes
      add constraint disputes_status_check
      check (status in ('open','waiting_admin','resolved','rejected'));
  end if;
end $$;

create or replace function public.disputes_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status in ('resolved','rejected') then
    new.resolved_at := coalesce(new.resolved_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_disputes_set_updated_at on public.disputes;
create trigger trg_disputes_set_updated_at
before update on public.disputes
for each row execute function public.disputes_set_updated_at();

create or replace function public.disputes_before_insert_fill()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
begin
  select o.* into v_order
  from public.orders o
  where o.id = new.order_id;

  if not found then
    raise exception 'Order tidak ditemukan';
  end if;

  -- Force canonical ownership (avoid client tampering)
  new.buyer_id := v_order.buyer_id;
  new.seller_id := v_order.seller_id;

  return new;
end;
$$;

drop trigger if exists trg_disputes_before_insert_fill on public.disputes;
create trigger trg_disputes_before_insert_fill
before insert on public.disputes
for each row execute function public.disputes_before_insert_fill();

alter table public.disputes enable row level security;

drop policy if exists "disputes_select_participants" on public.disputes;
create policy "disputes_select_participants"
on public.disputes
for select
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Buyer creates dispute for their order
drop policy if exists "disputes_insert_buyer" on public.disputes;
create policy "disputes_insert_buyer"
on public.disputes
for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
  and exists (
    select 1 from public.orders o
    where o.id = disputes.order_id
      and (o.buyer_id)::text = (auth.uid())::text
      and o.status in ('pending','shipped','delivered')
  )
);

-- Seller can respond (move to waiting_admin)
drop policy if exists "disputes_update_seller" on public.disputes;
create policy "disputes_update_seller"
on public.disputes
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

