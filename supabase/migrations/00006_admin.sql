-- 00006_admin.sql
-- PR7 (Phase 7): Admin Panel & Configuration tables and RLS policies.
-- Implements: R12 (tenant & branch management), R13 (user roles & memberships),
-- R14 (bank public key lifecycle & deactivation), R15 (beneficiary account management).

-- ============================================================================
-- beneficiary_configs (R5 / R15): configured destination accounts per tenant
-- ============================================================================
create table if not exists public.beneficiary_configs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  bank           text not null,
  account_number text not null,
  account_holder text not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, bank, account_number)
);

create trigger beneficiary_configs_set_updated_at
  before update on public.beneficiary_configs
  for each row execute function public.set_updated_at();

create index if not exists beneficiary_configs_tenant_active_idx
  on public.beneficiary_configs (tenant_id, is_active);

create index if not exists beneficiary_configs_lookup_idx
  on public.beneficiary_configs (tenant_id, bank, account_number, is_active);

alter table public.beneficiary_configs enable row level security;

-- SELECT: authenticated users can view beneficiary accounts for their tenant (R16)
create policy beneficiary_configs_select
  on public.beneficiary_configs for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

-- INSERT / UPDATE / DELETE: platform superadmin or tenant admin can manage accounts (R15)
create policy beneficiary_configs_modify
  on public.beneficiary_configs for all
  to authenticated
  using (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id))
  with check (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id));

-- Defensive: revoke anonymous access
revoke all on public.beneficiary_configs from anon;

-- ============================================================================
-- bank_public_keys CRUD policies (R14)
-- Adds admin INSERT / UPDATE / DELETE policies for bank public keys.
-- ============================================================================
create policy bank_public_keys_modify
  on public.bank_public_keys for all
  to authenticated
  using (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id))
  with check (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id));
