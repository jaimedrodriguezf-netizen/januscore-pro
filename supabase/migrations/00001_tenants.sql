-- 00001_tenants.sql
-- Foundation schema: tenants, branches, profiles, memberships + RLS isolation.
-- Implements: R12 (tenant/branch admin), R13 (user/role), R16 (RLS isolation).
-- Self-contained for PR1: every RLS policy references only tables created here.

-- Extensions / helpers ------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Standard audit columns helper (reused by later migrations) ----------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- tenants
-- ============================================================================
create table if not exists public.tenants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- ============================================================================
-- branches (tenant-scoped)
-- ============================================================================
create table if not exists public.branches (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  code       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create trigger branches_set_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

-- ============================================================================
-- profiles (mirrors auth.users; carries platform superadmin flag)
-- ============================================================================
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  is_platform_admin   boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- tenant_memberships (R13 roles: tenant_admin | operator)
-- ============================================================================
create table if not exists public.tenant_memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  role       text not null check (role in ('tenant_admin','operator')),
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);

-- ============================================================================
-- branch_memberships (operator -> branch within a tenant)
-- ============================================================================
create table if not exists public.branch_memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  branch_id   uuid not null references public.branches(id) on delete cascade,
  role        text not null default 'operator' check (role = 'operator'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, branch_id)
);

-- ============================================================================
-- Security-definer helpers (claim resolution without a JWT hook; free-plan OK)
-- All functions SECURITY DEFINER, search_path locked, owned by postgres role.
-- ============================================================================

-- True if the current auth user is a platform superadmin.
create or replace function public.am_i_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  );
$$;

-- True if the current auth user is tenant_admin for the given tenant.
create or replace function public.am_i_tenant_admin(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tenant_memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and role = 'tenant_admin'
  );
$$;

-- Tenant ids the current user may access (membership OR platform admin).
create or replace function public.get_my_tenant_ids()
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select array_agg(id)
    from public.tenants t
    where t.is_active and (
      public.am_i_platform_admin()
      or exists (
        select 1 from public.tenant_memberships tm
        where tm.user_id = auth.uid() and tm.tenant_id = t.id
      )
    )
  ), '{}'::uuid[]);
$$;

-- Branch ids the current user may access. Pass a tenant id to scope to one
-- tenant; omit to receive every branch across all accessible tenants.
create or replace function public.get_my_branch_ids(p_tenant_id uuid default null)
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  -- Platform admins see every active branch (optionally within one tenant).
  select coalesce((
    select array_agg(b.id)
    from public.branches b
    where b.is_active
      and b.tenant_id = any(public.get_my_tenant_ids())
      and (p_tenant_id is null or b.tenant_id = p_tenant_id)
      and (public.am_i_platform_admin() or exists (
        select 1 from public.branch_memberships bm
        where bm.user_id = auth.uid() and bm.branch_id = b.id
      ))
  ), '{}'::uuid[]);
$$;

-- Highest role the current user holds for the given tenant (or 'platform_admin').
-- Returns '' when the user has no access to that tenant.
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
      where tm.user_id = auth.uid() and tm.tenant_id = p_tenant_id
    ) then 'operator'
    else ''
  end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.tenants             enable row level security;
alter table public.branches            enable row level security;
alter table public.profiles           enable row level security;
alter table public.tenant_memberships  enable row level security;
alter table public.branch_memberships  enable row level security;

-- tenants -------------------------------------------------------------------
create policy tenants_select
  on public.tenants for select
  to authenticated
  using (id = any(public.get_my_tenant_ids()));

create policy tenants_modify
  on public.tenants for all
  to authenticated
  using (public.am_i_platform_admin())
  with check (public.am_i_platform_admin());

-- branches ------------------------------------------------------------------
create policy branches_select
  on public.branches for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

create policy branches_modify
  on public.branches for all
  to authenticated
  using (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id))
  with check (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id));

-- profiles ------------------------------------------------------------------
-- A user sees their own profile; platform admins see all; tenant admins see
-- every user that holds a membership in a tenant they administer.
create policy profiles_select_self_or_admin
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.am_i_platform_admin()
    or exists (
      select 1 from public.tenant_memberships tm
      where tm.user_id = profiles.id
        and tm.tenant_id in (select id from public.tenants t where public.am_i_tenant_admin(t.id))
    )
  );

create policy profiles_modify_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- tenant_memberships --------------------------------------------------------
create policy tenant_memberships_select
  on public.tenant_memberships for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.am_i_platform_admin()
    or public.am_i_tenant_admin(tenant_id)
  );

create policy tenant_memberships_modify
  on public.tenant_memberships for all
  to authenticated
  using (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id))
  with check (public.am_i_platform_admin() or public.am_i_tenant_admin(tenant_id));

-- branch_memberships --------------------------------------------------------
create policy branch_memberships_select
  on public.branch_memberships for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.am_i_platform_admin()
    or public.am_i_tenant_admin(tenant_id)
  );

create policy branch_memberships_modify
  on public.branch_memberships for all
  to authenticated
  using (
    public.am_i_platform_admin()
    or public.am_i_tenant_admin(tenant_id)
  )
  with check (
    public.am_i_platform_admin()
    or public.am_i_tenant_admin(tenant_id)
  );

-- ============================================================================
-- Defensive: no anonymous access to any foundation table.
-- ============================================================================
revoke all on public.tenants            from anon;
revoke all on public.branches            from anon;
revoke all on public.profiles            from anon;
revoke all on public.tenant_memberships  from anon;
revoke all on public.branch_memberships  from anon;