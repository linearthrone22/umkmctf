-- Feature: audit log perubahan penting (harga/stok/status order, moderation, disputes)
-- Depends on `30_admin_audit.sql` (creates `audit_logs` + `is_admin()`).
-- Safe to run multiple times.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

-- Note: we insert logs via SECURITY DEFINER function, not direct client insert.
drop policy if exists "audit_logs_insert_admin" on public.audit_logs;
create policy "audit_logs_insert_admin"
on public.audit_logs
for insert
to authenticated
with check (public.is_admin());

create or replace function public.write_audit_log(p_action text, p_target_table text, p_target_id uuid, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, target_table, target_id, payload)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_payload);
end;
$$;

-- ITEMS: price/stock/active/moderation changes
create or replace function public.audit_items_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if (new.price is distinct from old.price)
     or (new.stock is distinct from old.stock)
     or (new.is_active is distinct from old.is_active)
     or (new.commodity is distinct from old.commodity)
     or (new.location is distinct from old.location)
     or (new.image_url is distinct from old.image_url)
     or (new.category is distinct from old.category)
     or (new.discount_per_kg is distinct from old.discount_per_kg)
     or (new.min_stock is distinct from old.min_stock)
     or (new.moderation_status is distinct from old.moderation_status)
  then
    payload := jsonb_build_object(
      'old', jsonb_build_object(
        'price', old.price,
        'stock', old.stock,
        'is_active', old.is_active,
        'commodity', old.commodity,
        'location', old.location,
        'image_url', old.image_url,
        'category', old.category,
        'discount_per_kg', old.discount_per_kg,
        'min_stock', old.min_stock,
        'moderation_status', old.moderation_status
      ),
      'new', jsonb_build_object(
        'price', new.price,
        'stock', new.stock,
        'is_active', new.is_active,
        'commodity', new.commodity,
        'location', new.location,
        'image_url', new.image_url,
        'category', new.category,
        'discount_per_kg', new.discount_per_kg,
        'min_stock', new.min_stock,
        'moderation_status', new.moderation_status
      )
    );
    perform public.write_audit_log('items.update', 'items', new.id, payload);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_items_audit_update on public.items;
create trigger trg_items_audit_update
after update on public.items
for each row execute function public.audit_items_changes();

-- ORDERS: status/payment/delivery/escrow changes
create or replace function public.audit_orders_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if (new.status is distinct from old.status)
     or (new.payment_status is distinct from old.payment_status)
     or (new.delivered_at is distinct from old.delivered_at)
     or (new.shipping_cost_total is distinct from old.shipping_cost_total)
     or (new.escrow_status is distinct from old.escrow_status)
  then
    payload := jsonb_build_object(
      'old', jsonb_build_object(
        'status', old.status,
        'payment_status', old.payment_status,
        'delivered_at', old.delivered_at,
        'shipping_cost_total', old.shipping_cost_total,
        'escrow_status', old.escrow_status
      ),
      'new', jsonb_build_object(
        'status', new.status,
        'payment_status', new.payment_status,
        'delivered_at', new.delivered_at,
        'shipping_cost_total', new.shipping_cost_total,
        'escrow_status', new.escrow_status
      )
    );
    perform public.write_audit_log('orders.update', 'orders', new.id, payload);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_audit_update on public.orders;
create trigger trg_orders_audit_update
after update on public.orders
for each row execute function public.audit_orders_changes();

-- DISPUTES: create/update
create or replace function public.audit_disputes_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if tg_op = 'INSERT' then
    payload := jsonb_build_object('status', new.status, 'subject', new.subject);
    perform public.write_audit_log('disputes.insert', 'disputes', new.id, payload);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.status is distinct from old.status)
       or (new.seller_response is distinct from old.seller_response)
       or (new.admin_decision is distinct from old.admin_decision)
    then
      payload := jsonb_build_object(
        'old', jsonb_build_object('status', old.status),
        'new', jsonb_build_object('status', new.status)
      );
      perform public.write_audit_log('disputes.update', 'disputes', new.id, payload);
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_disputes_audit_insert on public.disputes;
create trigger trg_disputes_audit_insert
after insert on public.disputes
for each row execute function public.audit_disputes_changes();

drop trigger if exists trg_disputes_audit_update on public.disputes;
create trigger trg_disputes_audit_update
after update on public.disputes
for each row execute function public.audit_disputes_changes();

