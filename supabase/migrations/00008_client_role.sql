-- 00008_client_role.sql
-- Phase 8 (R13): Add 'client' role to tenancy memberships, role resolution RPC, and receipt visibility.

-- 1. Update tenant_memberships role check constraint
alter table public.tenant_memberships
  drop constraint if exists tenant_memberships_role_check;

alter table public.tenant_memberships
  add constraint tenant_memberships_role_check
  check (role in ('tenant_admin', 'operator', 'client'));

-- 2. Update get_my_role RPC function
create or replace function public.get_my_role(p_tenant_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.am_i_platform_admin() then 'platform_admin'
    when public.am_i_tenant_admin(p_tenant_id) then 'tenant_admin'
    when exists (
      select 1 from public.tenant_memberships tm
      where tm.user_id = auth.uid() and tm.tenant_id = p_tenant_id and tm.role = 'operator'
    ) then 'operator'
    when exists (
      select 1 from public.tenant_memberships tm
      where tm.user_id = auth.uid() and tm.tenant_id = p_tenant_id and tm.role = 'client'
    ) then 'client'
    else ''
  end;
$$;

-- 3. Update receipts_select RLS policy
drop policy if exists receipts_select on public.receipts;

create policy receipts_select
  on public.receipts for select
  to authenticated
  using (
    branch_id = any(public.get_my_branch_ids())
    or (
      tenant_id = any(public.get_my_tenant_ids())
      and uploaded_by = auth.uid()
    )
  );
