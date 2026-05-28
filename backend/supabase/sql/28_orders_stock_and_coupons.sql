-- Upgrade: stock automation + coupon pricing on order insert
-- This file replaces the existing `public.orders_before_insert_decrement_stock()` with coupon support.

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
  v_subtotal numeric;
  v_coupon_discount numeric := 0;
  v_coupon record;
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

  -- Price after item-level discount
  v_subtotal := greatest(0, coalesce(v_price, 0) - greatest(0, coalesce(v_discount, 0))) * new.quantity;

  -- Coupon support (optional)
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='coupon_code') then
    if new.coupon_code is not null and btrim(new.coupon_code) <> '' then
      select *
      into v_coupon
      from public.coupons c
      where lower(c.code) = lower(new.coupon_code)
        and coalesce(c.is_active, true) = true
        and (c.seller_id is null or (c.seller_id)::text = (v_seller_id)::text)
        and (c.valid_from is null or c.valid_from <= now())
        and (c.valid_to is null or c.valid_to >= now())
      limit 1;

      if found then
        if new.quantity >= coalesce(v_coupon.min_qty, 0) then
          if v_coupon.max_uses is null or coalesce(v_coupon.used_count, 0) < v_coupon.max_uses then
            case v_coupon.discount_type
              when 'percent' then
                v_coupon_discount := v_subtotal * (greatest(0, coalesce(v_coupon.amount, 0)) / 100);
              when 'fixed_per_kg' then
                v_coupon_discount := new.quantity * greatest(0, coalesce(v_coupon.amount, 0));
              else
                v_coupon_discount := 0;
            end case;
          end if;
        end if;
      end if;
    end if;
  end if;

  -- Force canonical values to avoid client tampering
  new.seller_id := v_seller_id;
  new.discount_total := least(v_subtotal, greatest(0, coalesce(v_coupon_discount, 0)));
  new.total_price := v_subtotal - new.discount_total;

  return new;
end;
$$;

-- Keep the same trigger name as `orders_stock_triggers.sql`
drop trigger if exists trg_orders_before_insert_decrement_stock on public.orders;
create trigger trg_orders_before_insert_decrement_stock
before insert on public.orders
for each row
execute function public.orders_before_insert_decrement_stock();

