-- Stock automation for Supabase (Postgres)
-- - Decrement item stock when a buyer creates an order (INSERT into public.orders)
-- - Restock when buyer cancels (status: pending -> cancelled)
--
-- Notes:
-- - Assumes `public.items.stock` is numeric/integer and `public.items.price` is numeric/integer.
-- - Assumes `public.items.id` matches `public.orders.item_id`.
-- - Assumes `public.items.is_active` exists (see `00_core_schema.sql`) for auto-hide when stock hits 0.
-- - Runs as table owner; RLS bypass depends on `rls_forced = false` (default in your setup).

create or replace function public.orders_before_insert_decrement_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_stock numeric;
  v_price numeric;
  v_discount numeric;
  v_seller_id uuid;
  v_is_active boolean;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = auth.uid();

  if coalesce(v_role, '') <> 'buyer' then
    raise exception 'Only buyer can create orders';
  end if;

  if (new.buyer_id)::text <> (auth.uid())::text then
    raise exception 'buyer_id must match auth.uid()';
  end if;

  if new.quantity is null or new.quantity <= 0 then
    new.quantity := 1;
  end if;

  if new.status is null or btrim(new.status) = '' then
    new.status := 'pending';
  end if;

  -- Lock item row for concurrency safety
  select
    i.stock,
    i.price,
    i.discount_per_kg,
    i.seller_id,
    coalesce(i.is_active, true)
  into
    v_stock,
    v_price,
    v_discount,
    v_seller_id,
    v_is_active
  from public.items i
  where i.id = new.item_id
  for update;

  if not found then
    raise exception 'Item tidak ditemukan';
  end if;

  if v_is_active is false then
    raise exception 'Item sudah tidak aktif';
  end if;

  if v_stock < new.quantity then
    raise exception 'Stok tidak cukup. Sisa: %, diminta: %', v_stock, new.quantity;
  end if;

  update public.items
  set
    stock = stock - new.quantity,
    is_active = case when (stock - new.quantity) > 0 then true else false end
  where id = new.item_id;

  -- Force canonical values to avoid client tampering
  new.seller_id := v_seller_id;
  new.total_price := greatest(0, coalesce(v_price, 0) - greatest(0, coalesce(v_discount, 0))) * new.quantity;
  new.status := new.status; -- keep whatever caller sets (normally pending)

  return new;
end;
$$;

drop trigger if exists trg_orders_before_insert_decrement_stock on public.orders;
create trigger trg_orders_before_insert_decrement_stock
before insert on public.orders
for each row
execute function public.orders_before_insert_decrement_stock();

create or replace function public.orders_after_update_restock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status = 'cancelled' then
    update public.items
    set
      stock = stock + coalesce(old.quantity, 1),
      is_active = true
    where id = old.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_after_update_restock_on_cancel on public.orders;
create trigger trg_orders_after_update_restock_on_cancel
after update of status on public.orders
for each row
execute function public.orders_after_update_restock_on_cancel();
