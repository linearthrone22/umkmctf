-- Upgrade: Logistics + Payments (multi-drop meta, armada pricing, POD, refund/retur, escrow, invoice number, tax fields)
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS / idempotent checks).

create extension if not exists pgcrypto;

-- =========================
-- Profiles: business fields
-- =========================
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists business_address text;
alter table public.profiles add column if not exists tax_id text;

-- =========================
-- Orders: delivery + finance
-- =========================
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists receiver_name text;
alter table public.orders add column if not exists pod_photo_url text;
alter table public.orders add column if not exists pod_signature_url text;

alter table public.orders add column if not exists vehicle_type text;
alter table public.orders add column if not exists shipping_cost_total numeric;
alter table public.orders add column if not exists shipping_cost_breakdown jsonb;

alter table public.orders add column if not exists escrow_status text not null default 'none';
alter table public.orders add column if not exists escrow_amount numeric not null default 0;
alter table public.orders add column if not exists released_at timestamptz;

alter table public.orders add column if not exists invoice_no text;

-- Backfill defaults for older rows
update public.orders set escrow_status = 'none' where escrow_status is null;
update public.orders set escrow_amount = 0 where escrow_amount is null;
update public.orders
set invoice_no =
  'INV-' || to_char(coalesce(created_at, now()), 'YYYYMMDD') || '-' ||
  upper(substr(replace((id)::text, '-', ''), 1, 8))
where invoice_no is null or btrim(invoice_no) = '';

-- Backfill escrow for existing rows (paid => held, paid+delivered => released)
update public.orders
set escrow_status = 'held',
    escrow_amount = case when coalesce(escrow_amount, 0) = 0 then coalesce(total_price, 0) else escrow_amount end
where coalesce(payment_status, 'unpaid') = 'paid'
  and coalesce(escrow_status, 'none') = 'none';

update public.orders
set delivered_at = coalesce(delivered_at, now()),
    escrow_status = 'released',
    released_at = coalesce(released_at, now())
where coalesce(payment_status, 'unpaid') = 'paid'
  and coalesce(status, '') = 'delivered'
  and coalesce(escrow_status, '') <> 'released';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_escrow_status_check') then
    alter table public.orders
      add constraint orders_escrow_status_check
      check (escrow_status in ('none','held','released'));
  end if;
end $$;

-- =========================
-- Shipments: store pricing/meta
-- =========================
alter table public.shipments add column if not exists vehicle_type text;
alter table public.shipments add column if not exists shipping_cost_total numeric;
alter table public.shipments add column if not exists shipping_cost_breakdown jsonb;
alter table public.shipments add column if not exists route_distance_km numeric;
alter table public.shipments add column if not exists route_duration_mins integer;
alter table public.shipments add column if not exists waypoint_order integer[];

-- =========================
-- Refund/Retur flow
-- =========================
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null default 0,
  reason text not null,
  status text not null default 'requested', -- requested | approved | rejected | refunded
  seller_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_refund_requests_order_id on public.refund_requests(order_id);
create index if not exists idx_refund_requests_seller_id on public.refund_requests(seller_id);
create index if not exists idx_refund_requests_buyer_id on public.refund_requests(buyer_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'refund_requests_status_check') then
    alter table public.refund_requests
      add constraint refund_requests_status_check
      check (status in ('requested','approved','rejected','refunded'));
  end if;
end $$;

create or replace function public.set_refund_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status in ('approved','rejected','refunded') then
    new.resolved_at := coalesce(new.resolved_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_refund_requests_set_updated_at on public.refund_requests;
create trigger trg_refund_requests_set_updated_at
before update on public.refund_requests
for each row execute function public.set_refund_requests_updated_at();

create or replace function public.refund_requests_before_insert_fill()
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

  -- Force canonical owner values (avoid client tampering)
  new.buyer_id := v_order.buyer_id;
  new.seller_id := v_order.seller_id;
  if coalesce(new.amount, 0) <= 0 then
    new.amount := coalesce(v_order.total_price, 0);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_refund_requests_before_insert_fill on public.refund_requests;
create trigger trg_refund_requests_before_insert_fill
before insert on public.refund_requests
for each row execute function public.refund_requests_before_insert_fill();

alter table public.refund_requests enable row level security;

drop policy if exists "refund_requests_select_buyer_or_seller" on public.refund_requests;
create policy "refund_requests_select_buyer_or_seller"
on public.refund_requests
for select
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "refund_requests_insert_buyer" on public.refund_requests;
create policy "refund_requests_insert_buyer"
on public.refund_requests
for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
  and exists (
    select 1 from public.orders o
    where o.id = refund_requests.order_id
      and (o.buyer_id)::text = (auth.uid())::text
      and o.status in ('shipped','delivered')
  )
);

drop policy if exists "refund_requests_update_seller" on public.refund_requests;
create policy "refund_requests_update_seller"
on public.refund_requests
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

-- =========================
-- Invoice number + Escrow automation
-- =========================
create or replace function public.orders_before_insert_invoice_escrow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invoice_no is null or btrim(new.invoice_no) = '' then
    new.invoice_no :=
      'INV-' || to_char(coalesce(new.created_at, now()), 'YYYYMMDD') || '-' ||
      upper(substr(replace((new.id)::text, '-', ''), 1, 8));
  end if;

  if coalesce(new.payment_status, 'unpaid') = 'paid' then
    if coalesce(new.escrow_status, 'none') = 'none' then
      new.escrow_status := 'held';
    end if;
    if coalesce(new.escrow_amount, 0) = 0 then
      new.escrow_amount := coalesce(new.total_price, 0);
    end if;

    if coalesce(new.status, '') = 'delivered' and coalesce(new.escrow_status, '') <> 'released' then
      new.escrow_status := 'released';
      new.released_at := coalesce(new.released_at, now());
    end if;
  end if;

  if coalesce(new.status, '') = 'delivered' then
    new.delivered_at := coalesce(new.delivered_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.orders_before_update_invoice_escrow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invoice_no is null or btrim(new.invoice_no) = '' then
    new.invoice_no :=
      'INV-' || to_char(coalesce(new.created_at, now()), 'YYYYMMDD') || '-' ||
      upper(substr(replace((new.id)::text, '-', ''), 1, 8));
  end if;

  if coalesce(new.status, '') = 'delivered' and (old.status is distinct from 'delivered') then
    new.delivered_at := coalesce(new.delivered_at, now());
  end if;

  if coalesce(new.payment_status, 'unpaid') = 'paid' then
    if coalesce(old.payment_status, 'unpaid') <> 'paid' then
      if coalesce(new.escrow_status, 'none') = 'none' then
        new.escrow_status := 'held';
      end if;
      if coalesce(new.escrow_amount, 0) = 0 then
        new.escrow_amount := coalesce(new.total_price, 0);
      end if;
    end if;

    if coalesce(new.status, '') = 'delivered' and coalesce(new.escrow_status, '') <> 'released' then
      new.escrow_status := 'released';
      new.released_at := coalesce(new.released_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_before_insert_invoice_escrow on public.orders;
create trigger trg_orders_before_insert_invoice_escrow
before insert on public.orders
for each row execute function public.orders_before_insert_invoice_escrow();

drop trigger if exists trg_orders_before_update_invoice_escrow on public.orders;
create trigger trg_orders_before_update_invoice_escrow
before update on public.orders
for each row execute function public.orders_before_update_invoice_escrow();
