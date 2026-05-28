-- Feature: soft delete orders for buyer history (hide from buyer without deleting row)
-- Safe to run multiple times.

create extension if not exists pgcrypto;

alter table public.orders add column if not exists is_deleted_by_buyer boolean not null default false;

-- Backfill nulls
update public.orders set is_deleted_by_buyer = false where is_deleted_by_buyer is null;

-- Update select policy: buyer won't see orders they hid, but seller/admin still can.
drop policy if exists "orders_select_buyer_or_seller" on public.orders;
create policy "orders_select_buyer_or_seller"
on public.orders
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or (
    (seller_id)::text = (auth.uid())::text
  )
  or (
    (buyer_id)::text = (auth.uid())::text
    and coalesce(is_deleted_by_buyer, false) = false
  )
);

-- Buyer can update only two things:
-- - pending -> cancelled (existing flow)
-- - mark is_deleted_by_buyer=true for non-pending
create or replace function public.orders_guard_buyer_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_is_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated';
  end if;

  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into v_is_admin;
  if coalesce(v_is_admin,false) then
    return new;
  end if;

  select p.role into v_role from public.profiles p where p.id = auth.uid();

  if coalesce(v_role,'') <> 'buyer' then
    return new; -- seller/admin handled by RLS policies
  end if;

  if (old.buyer_id)::text <> (auth.uid())::text then
    raise exception 'Forbidden: not buyer owner';
  end if;

  -- Allow cancel only when pending
  if old.status = 'pending' and new.status = 'cancelled' then
    return new;
  end if;

  -- Allow soft delete history when non-pending, only flipping is_deleted_by_buyer -> true
  if old.status <> 'pending'
     and coalesce(old.is_deleted_by_buyer,false) = false
     and coalesce(new.is_deleted_by_buyer,false) = true
  then
    if (new.buyer_id is distinct from old.buyer_id)
       or (new.seller_id is distinct from old.seller_id)
       or (new.item_id is distinct from old.item_id)
       or (new.quantity is distinct from old.quantity)
       or (new.total_price is distinct from old.total_price)
       or (new.status is distinct from old.status)
       or (new.payment_status is distinct from old.payment_status)
       or (new.shipping_address_id is distinct from old.shipping_address_id)
       or (new.notes is distinct from old.notes)
       or (new.created_at is distinct from old.created_at)
    then
      raise exception 'Forbidden: buyer can only soft-delete history';
    end if;
    return new;
  end if;

  raise exception 'Forbidden: buyer update not allowed';
end;
$$;

drop trigger if exists trg_orders_guard_buyer_updates on public.orders;
create trigger trg_orders_guard_buyer_updates
before update on public.orders
for each row execute function public.orders_guard_buyer_updates();

-- Buyer soft delete policy (RLS) - update must pass guard trigger above
drop policy if exists "orders_update_buyer_soft_delete_history" on public.orders;
create policy "orders_update_buyer_soft_delete_history"
on public.orders
for update
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  and status <> 'pending'
)
with check (
  (buyer_id)::text = (auth.uid())::text
);

