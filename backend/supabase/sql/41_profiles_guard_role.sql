-- Security hardening: prevent non-admin users from changing profiles.role.
-- Safe to run multiple times.

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    execute $fn$
      create function public.is_admin()
      returns boolean
      language sql
      stable
      as $$
        select exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        );
      $$;
    $fn$;
  end if;
end $$;

create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  -- Only admins can change role.
  select public.is_admin() into v_is_admin;

  if coalesce(v_is_admin, false) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Forbidden: role is admin-only';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_role on public.profiles;
create trigger trg_profiles_guard_role
before update on public.profiles
for each row execute function public.profiles_guard_role();
