-- Feature: reviews / ratings

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  item_id uuid not null references public.items(id),
  order_id uuid not null references public.orders(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_unique_order'
  ) then
    alter table public.reviews
      add constraint reviews_unique_order unique (order_id);
  end if;
end $$;

create index if not exists idx_reviews_item_id on public.reviews(item_id);
create index if not exists idx_reviews_seller_id on public.reviews(seller_id);

alter table public.reviews enable row level security;

-- Read reviews for marketplace (authenticated)
drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_authenticated"
on public.reviews
for select
to authenticated
using (true);

-- Buyer creates own review
drop policy if exists "reviews_insert_buyer" on public.reviews;
create policy "reviews_insert_buyer"
on public.reviews
for insert
to authenticated
with check (
  (buyer_id)::text = (auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
);

