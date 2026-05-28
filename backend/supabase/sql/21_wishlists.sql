-- Feature: wishlists (buyer favorites)

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  item_id uuid not null references public.items(id),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'wishlists_unique_buyer_item'
  ) then
    alter table public.wishlists
      add constraint wishlists_unique_buyer_item unique (buyer_id, item_id);
  end if;
end $$;

create index if not exists idx_wishlists_buyer_id on public.wishlists(buyer_id);
create index if not exists idx_wishlists_item_id on public.wishlists(item_id);

alter table public.wishlists enable row level security;

drop policy if exists "wishlists_select_self" on public.wishlists;
create policy "wishlists_select_self"
on public.wishlists
for select
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "wishlists_insert_self" on public.wishlists;
create policy "wishlists_insert_self"
on public.wishlists
for insert
to authenticated
with check ((buyer_id)::text = (auth.uid())::text);

drop policy if exists "wishlists_delete_self" on public.wishlists;
create policy "wishlists_delete_self"
on public.wishlists
for delete
to authenticated
using ((buyer_id)::text = (auth.uid())::text);

