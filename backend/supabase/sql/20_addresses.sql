-- Feature: addresses (multi alamat buyer)

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  label text not null default 'Alamat',
  address_text text not null default '',
  location text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_buyer_id on public.addresses(buyer_id);

alter table public.addresses enable row level security;

-- Optional FK from orders to addresses (safe-if-exists)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='shipping_address_id')
     and not exists (select 1 from pg_constraint where conname = 'orders_shipping_address_id_fkey') then
    alter table public.orders
      add constraint orders_shipping_address_id_fkey
      foreign key (shipping_address_id) references public.addresses(id);
  end if;
end $$;

drop policy if exists "addresses_select_self" on public.addresses;
create policy "addresses_select_self"
on public.addresses
for select
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "addresses_insert_self" on public.addresses;
create policy "addresses_insert_self"
on public.addresses
for insert
to authenticated
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "addresses_update_self" on public.addresses;
create policy "addresses_update_self"
on public.addresses
for update
to authenticated
using ((buyer_id)::text = (auth.uid())::text)
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "addresses_delete_self" on public.addresses;
create policy "addresses_delete_self"
on public.addresses
for delete
to authenticated
using ((buyer_id)::text = (auth.uid())::text);
