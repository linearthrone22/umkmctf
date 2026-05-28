-- Feature: listing moderation (approve/reject) + reason template
-- Safe to run multiple times.

alter table public.items add column if not exists moderation_status text;
alter table public.items add column if not exists moderation_reason text;
alter table public.items add column if not exists moderated_by uuid references public.profiles(id);
alter table public.items add column if not exists moderated_at timestamptz;

-- Existing items become approved, then new inserts default to pending
update public.items set moderation_status = 'approved' where moderation_status is null or btrim(moderation_status) = '';
alter table public.items alter column moderation_status set default 'pending';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'items_moderation_status_check') then
    alter table public.items
      add constraint items_moderation_status_check
      check (moderation_status in ('approved','pending','rejected'));
  end if;
end $$;

-- Replace select policy: buyers only see approved listings
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
    and coalesce(items.moderation_status, 'approved') = 'approved'
  )
);

-- Guard: non-admin cannot modify moderation fields
create or replace function public.items_guard_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select public.is_admin() into v_is_admin;
  if coalesce(v_is_admin,false) then
    if (new.moderation_status is distinct from old.moderation_status)
       or (new.moderation_reason is distinct from old.moderation_reason)
    then
      new.moderated_by := auth.uid();
      new.moderated_at := now();
    end if;
    return new;
  end if;

  if (new.moderation_status is distinct from old.moderation_status)
     or (new.moderation_reason is distinct from old.moderation_reason)
     or (new.moderated_by is distinct from old.moderated_by)
     or (new.moderated_at is distinct from old.moderated_at)
  then
    raise exception 'Forbidden: moderation fields are admin-only.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_items_guard_moderation_fields on public.items;
create trigger trg_items_guard_moderation_fields
before update on public.items
for each row execute function public.items_guard_moderation_fields();

