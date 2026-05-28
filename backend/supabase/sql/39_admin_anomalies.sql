-- Feature: admin anomaly dashboard (stok negatif, order gagal, seller inactive)
-- Safe to run multiple times.

create or replace function public.get_admin_anomalies()
returns table(
  kind text,
  severity int,
  title text,
  details text,
  entity_table text,
  entity_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select * from (
    -- Negative stock
    select
      'stock'::text as kind,
      3 as severity,
      'Stok negatif'::text as title,
      ('stock=' || coalesce(i.stock,0))::text as details,
      'items'::text as entity_table,
      i.id as entity_id,
      i.created_at as created_at
    from public.items i
    where coalesce(i.stock,0) < 0

    union all

    -- Pending too long
    select
      'orders'::text,
      2,
      'Order pending > 7 hari'::text,
      ('status=' || o.status)::text,
      'orders'::text,
      o.id,
      o.created_at
    from public.orders o
    where o.status = 'pending'
      and o.created_at < now() - interval '7 days'

    union all

    -- Suspicious totals
    select
      'orders'::text,
      3,
      'Total order negatif'::text,
      ('total_price=' || coalesce(o.total_price,0))::text,
      'orders'::text,
      o.id,
      o.created_at
    from public.orders o
    where coalesce(o.total_price,0) < 0

    union all

    -- Seller missing location
    select
      'profiles'::text,
      1,
      'Seller tanpa lokasi'::text,
      'location kosong'::text,
      'profiles'::text,
      p.id,
      p.created_at
    from public.profiles p
    where p.role = 'seller'
      and (p.location is null or btrim(p.location) = '')

    union all

    -- Listing pending too long
    select
      'moderation'::text,
      1,
      'Listing pending > 3 hari'::text,
      ('commodity=' || i.commodity)::text,
      'items'::text,
      i.id,
      i.created_at
    from public.items i
    where coalesce(i.moderation_status,'approved') = 'pending'
      and i.created_at < now() - interval '3 days'
  ) x
  where public.is_admin()
  order by severity desc, created_at desc
  limit 200;
$$;

