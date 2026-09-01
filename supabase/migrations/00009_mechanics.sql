-- 00009_mechanics.sql
-- Mechanics & Automotive Maintenance QR Module.

-- 1. vehicles table
create table if not exists public.vehicles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  plate           text not null,
  brand           text not null,
  model           text not null,
  year            integer,
  owner_name      text,
  owner_phone     text,
  current_mileage integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, plate)
);

create index if not exists idx_vehicles_plate on public.vehicles (plate);

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- 2. maintenance_records table
create table if not exists public.maintenance_records (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  vehicle_id           uuid not null references public.vehicles(id) on delete cascade,
  service_date         timestamptz not null default now(),
  mileage              integer not null,
  service_type         text not null check (service_type in ('oil_change','brakes','suspension','full_abc','alignment_balancing','general_repair')),
  description          text not null,
  technician_name      text,
  cost                 numeric(12,2),
  status               text not null default 'completed' check (status in ('completed','in_progress')),
  next_service_date    date,
  next_service_mileage integer,
  created_at           timestamptz not null default now()
);

create index if not exists idx_maintenance_vehicle on public.maintenance_records (vehicle_id, service_date desc);

-- 3. RLS Policies
alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;

-- Vehicles: Authenticated operators see their tenant's vehicles; Anon can view vehicles for the public QR page
create policy vehicles_select_auth
  on public.vehicles for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

create policy vehicles_select_anon
  on public.vehicles for select
  to anon
  using (true);

create policy vehicles_modify
  on public.vehicles for all
  to authenticated
  using (
    public.am_i_platform_admin() 
    or public.am_i_tenant_admin(tenant_id)
    or exists (select 1 from public.branch_memberships bm where bm.user_id = auth.uid() and bm.tenant_id = tenant_id)
  )
  with check (
    public.am_i_platform_admin() 
    or public.am_i_tenant_admin(tenant_id)
    or exists (select 1 from public.branch_memberships bm where bm.user_id = auth.uid() and bm.tenant_id = tenant_id)
  );

-- Maintenance: Authenticated operators see their tenant records; Anon can view completed records on public QR page
create policy maintenance_select_auth
  on public.maintenance_records for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

create policy maintenance_select_anon
  on public.maintenance_records for select
  to anon
  using (status = 'completed');

create policy maintenance_modify
  on public.maintenance_records for all
  to authenticated
  using (
    public.am_i_platform_admin() 
    or public.am_i_tenant_admin(tenant_id)
    or exists (select 1 from public.branch_memberships bm where bm.user_id = auth.uid() and bm.tenant_id = tenant_id)
  )
  with check (
    public.am_i_platform_admin() 
    or public.am_i_tenant_admin(tenant_id)
    or exists (select 1 from public.branch_memberships bm where bm.user_id = auth.uid() and bm.tenant_id = tenant_id)
  );
