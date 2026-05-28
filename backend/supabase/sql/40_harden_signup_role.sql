-- Security hardening: prevent self-assigning admin role via signup metadata
-- Run after `00_core_schema.sql`. Safe to run multiple times.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  -- Only allow buyer/seller from client metadata. Admin must be set manually by trusted operator.
  v_role := lower(coalesce(new.raw_user_meta_data->>'role', 'buyer'));
  if v_role not in ('buyer','seller') then
    v_role := 'buyer';
  end if;

  insert into public.profiles (id, username, role, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'User'),
    v_role,
    coalesce(new.raw_user_meta_data->>'location', '')
  )
  on conflict (id) do update
    set username = excluded.username,
        role = excluded.role,
        location = excluded.location;

  return new;
end;
$$;

