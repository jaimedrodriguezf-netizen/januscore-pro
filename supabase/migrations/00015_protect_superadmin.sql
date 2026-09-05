-- 00015_protect_superadmin.sql
-- Fix privilege escalation vulnerability: prevent authenticated users from setting is_platform_admin = true.

-- 1. Trigger function to prevent unauthorized escalation of is_platform_admin
create or replace function public.protect_profile_platform_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_platform_admin is distinct from old.is_platform_admin then
    -- If authenticated user is calling, they MUST already be a platform admin
    if nullif(current_setting('request.jwt.claim.sub', true), '') is not null then
      if not public.am_i_platform_admin() then
        raise exception 'Violación de Seguridad: No tienes permisos para modificar privilegios de Superadministrador.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_protect_profile_platform_admin on public.profiles;
create trigger trigger_protect_profile_platform_admin
  before update on public.profiles
  for each row execute function public.protect_profile_platform_admin();

-- 2. Revoke column update permissions on is_platform_admin for client roles
revoke update (is_platform_admin) on public.profiles from authenticated, anon;
grant update (full_name, email) on public.profiles to authenticated;

-- 3. Hardened profiles_modify_self RLS policy
drop policy if exists profiles_modify_self on public.profiles;
create policy profiles_modify_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.am_i_platform_admin())
  with check (id = auth.uid() or public.am_i_platform_admin());
