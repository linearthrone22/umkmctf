-- RLS: orders
-- Note: if you use `shipping_address_id`, run `20_addresses.sql` before this file.

alter table public.orders enable row level security;

drop policy if exists "orders_select_buyer_or_seller" on public.orders;
create policy "orders_select_buyer_or_seller"
on public.orders
for select
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  or (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer"
on public.orders
for insert
to authenticated
with check (
  (buyer_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
  and (
    shipping_address_id is null
    or exists (
      select 1 from public.addresses a
      where a.id = orders.shipping_address_id
        and (a.buyer_id)::text = (auth.uid())::text
    )
  )
);

-- Buyer can cancel only pending orders (pending -> cancelled)
drop policy if exists "orders_update_buyer_cancel" on public.orders;
create policy "orders_update_buyer_cancel"
on public.orders
for update
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  and status = 'pending'
)
with check (
  (buyer_id)::text = (auth.uid())::text
  and status = 'cancelled'
);

-- Seller can update their orders (status/payment, etc)
drop policy if exists "orders_update_seller" on public.orders;
create policy "orders_update_seller"
on public.orders
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

-- Buyer can delete non-pending orders from history
drop policy if exists "orders_delete_buyer_history" on public.orders;
create policy "orders_delete_buyer_history"
on public.orders
for delete
to authenticated
using (
  (buyer_id)::text = (auth.uid())::text
  and status <> 'pending'
);
