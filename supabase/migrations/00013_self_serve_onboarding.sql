-- 00013_self_serve_onboarding.sql
-- Atomic Self-Serve Onboarding RPC for newly registered users.
-- Allows authenticated users without a tenant to provision their own workshop/tenant,
-- creating the default branch and assigning them as 'tenant_admin' in a single transaction.

create or replace function public.onboard_new_tenant(
  p_name text,
  p_slug text default null,
  p_business_type text default 'mechanics'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
  v_branch_id uuid;
  v_clean_slug text;
  v_modules text[];
  v_btype text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to onboard a tenant';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'El nombre de la empresa o taller es obligatorio';
  end if;

  -- Validate and normalize business type
  v_btype := coalesce(p_business_type, 'mechanics');
  if v_btype not in ('all', 'mechanics', 'financial_receipts') then
    v_btype := 'mechanics';
  end if;

  -- Clean slug: lowercase, replace non-alphanumeric with hyphen, trim hyphens
  v_clean_slug := lower(regexp_replace(coalesce(nullif(trim(p_slug), ''), trim(p_name)), '[^a-zA-Z0-9]+', '-', 'g'));
  v_clean_slug := trim(both '-' from v_clean_slug);
  if v_clean_slug = '' then
    v_clean_slug := 'taller-' || substr(gen_random_uuid()::text, 1, 8);
  end if;

  -- Ensure uniqueness: if slug exists, append random suffix
  if exists (select 1 from public.tenants where slug = v_clean_slug) then
    v_clean_slug := v_clean_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  -- Determine modules
  if v_btype = 'financial_receipts' then
    v_modules := array['financial_receipts'];
  elsif v_btype = 'all' then
    v_modules := array['mechanics', 'financial_receipts'];
  else
    v_modules := array['mechanics'];
  end if;

  -- 1. Create tenant
  insert into public.tenants (name, slug, business_type, modules, is_active)
  values (trim(p_name), v_clean_slug, v_btype, v_modules, true)
  returning id into v_tenant_id;

  -- 2. Create default main branch
  insert into public.branches (tenant_id, name, code, is_active)
  values (v_tenant_id, 'Casa Central', 'MAIN', true)
  returning id into v_branch_id;

  -- 3. Assign user as tenant_admin
  insert into public.tenant_memberships (user_id, tenant_id, role)
  values (v_user_id, v_tenant_id, 'tenant_admin');

  -- 4. Assign user to default branch as operator
  insert into public.branch_memberships (user_id, tenant_id, branch_id, role)
  values (v_user_id, v_tenant_id, v_branch_id, 'operator');

  return v_tenant_id;
end;
$$;

grant execute on function public.onboard_new_tenant(text, text, text) to authenticated;
