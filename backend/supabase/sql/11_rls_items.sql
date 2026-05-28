-- RLS: items

alter table public.items enable row level security;

-- Buyers can read active items; sellers can read their own items (including inactive)
drop policy if exists "items_select_by_role" on public.items;
create policy "items_select_by_role"
on public.items
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
    and (items.seller_id)::text = (auth.uid())::text
  )
  or (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
    and coalesce(items.is_active, true) = true
  )
);

drop policy if exists "items_insert_own_seller" on public.items;
create policy "items_insert_own_seller"
on public.items
for insert
to authenticated
with check (
  (seller_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
);

drop policy if exists "items_update_own_seller" on public.items;
create policy "items_update_own_seller"
on public.items
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
