-- RLS: shipments

alter table public.shipments enable row level security;

drop policy if exists "shipments_select_own_seller" on public.shipments;
create policy "shipments_select_own_seller"
on public.shipments
for select
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "shipments_insert_own_seller" on public.shipments;
create policy "shipments_insert_own_seller"
on public.shipments
for insert
to authenticated
with check (
  (seller_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
);

drop policy if exists "shipments_delete_own_seller" on public.shipments;
create policy "shipments_delete_own_seller"
on public.shipments
for delete
to authenticated
using (
  (seller_id)::text = (auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

