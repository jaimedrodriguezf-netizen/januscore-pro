-- 00014_invite_member_by_email.sql
-- Security Definer RPC for tenant admins to add registered users by email to their organization.

create or replace function public.add_tenant_member_by_email(
  p_tenant_id uuid,
  p_email text,
  p_role text default 'operator',
  p_branch_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_target_user_id uuid;
  v_clean_email text;
  v_clean_role text;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- Verify authorization
  if not (public.am_i_platform_admin() or public.am_i_tenant_admin(p_tenant_id)) then
    raise exception 'No tienes permisos de administrador en esta organización';
  end if;

  v_clean_email := lower(trim(p_email));
  if v_clean_email = '' or v_clean_email is null then
    raise exception 'El correo electrónico es obligatorio';
  end if;

  v_clean_role := coalesce(p_role, 'operator');
  if v_clean_role not in ('tenant_admin', 'operator', 'client') then
    raise exception 'Rol no válido. Debe ser tenant_admin, operator o client';
  end if;

  -- Find user in profiles
  select id into v_target_user_id
  from public.profiles
  where lower(email) = v_clean_email;

  if v_target_user_id is null then
    raise exception 'No se encontró ningún usuario registrado con el correo "%". Pídele que se registre primero en la plataforma.', v_clean_email;
  end if;

  -- Check if already member
  if exists (
    select 1 from public.tenant_memberships
    where tenant_id = p_tenant_id and user_id = v_target_user_id
  ) then
    raise exception 'El usuario "%" ya es miembro de esta organización', v_clean_email;
  end if;

  -- 1. Insert tenant membership
  insert into public.tenant_memberships (user_id, tenant_id, role)
  values (v_target_user_id, p_tenant_id, v_clean_role);

  -- 2. If branch is specified, verify it belongs to this tenant and insert branch membership
  if p_branch_id is not null then
    if exists (select 1 from public.branches where id = p_branch_id and tenant_id = p_tenant_id) then
      insert into public.branch_memberships (user_id, tenant_id, branch_id, role, is_default)
      values (v_target_user_id, p_tenant_id, p_branch_id, 'operator', true)
      on conflict do nothing;
    end if;
  end if;

  return v_target_user_id;
end;
$$;

grant execute on function public.add_tenant_member_by_email(uuid, text, text, uuid) to authenticated;
