-- 00016_harden_public_vehicle_scraping.sql
-- Drop wide-open anon select policies that allow bots to dump the entire vehicles & maintenance tables.
-- Replace with strictly-scoped SECURITY DEFINER RPCs that require an exact plate or vehicle ID.

-- 1. Drop wide-open anon dump policies
drop policy if exists vehicles_select_anon on public.vehicles;
drop policy if exists maintenance_select_anon on public.maintenance_records;

-- 2. Scoped public vehicle lookup RPC
drop function if exists public.get_public_vehicle_by_plate(text, uuid);
create or replace function public.get_public_vehicle_by_plate(
  p_plate text,
  p_tenant_id uuid default null
)
returns table (
  id uuid,
  tenant_id uuid,
  plate text,
  brand text,
  model text,
  year int,
  current_mileage int,
  owner_name text,
  owner_phone text,
  created_at timestamptz,
  updated_at timestamptz,
  tenant_name text,
  tenant_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_plate text;
begin
  v_clean_plate := upper(trim(p_plate));
  if v_clean_plate = '' or v_clean_plate is null then
    return;
  end if;

  return query
  select 
    v.id,
    v.tenant_id,
    v.plate,
    v.brand,
    v.model,
    v.year,
    v.current_mileage,
    v.owner_name,
    case 
      when v.owner_phone is not null and length(v.owner_phone) >= 7 then
        substr(v.owner_phone, 1, 3) || '****' || substr(v.owner_phone, length(v.owner_phone) - 2)
      else v.owner_phone
    end as owner_phone,
    v.created_at,
    v.updated_at,
    t.name as tenant_name,
    t.slug as tenant_slug
  from public.vehicles v
  left join public.tenants t on t.id = v.tenant_id
  where v.plate = v_clean_plate
    and (p_tenant_id is null or v.tenant_id = p_tenant_id)
  limit 1;
end;
$$;

grant execute on function public.get_public_vehicle_by_plate(text, uuid) to anon, authenticated;

-- 3. Scoped public maintenance history RPC
drop function if exists public.get_public_maintenance_records(uuid);
create or replace function public.get_public_maintenance_records(
  p_vehicle_id uuid
)
returns table (
  id uuid,
  vehicle_id uuid,
  tenant_id uuid,
  service_date timestamptz,
  mileage int,
  service_type text,
  description text,
  technician_name text,
  cost numeric,
  status text,
  next_service_date date,
  next_service_mileage int,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_vehicle_id is null then
    return;
  end if;

  return query
  select 
    mr.id,
    mr.vehicle_id,
    mr.tenant_id,
    mr.service_date,
    mr.mileage,
    mr.service_type,
    mr.description,
    mr.technician_name,
    mr.cost,
    mr.status,
    mr.next_service_date,
    mr.next_service_mileage,
    mr.created_at
  from public.maintenance_records mr
  where mr.vehicle_id = p_vehicle_id
    and mr.status = 'completed'
  order by mr.service_date desc;
end;
$$;

grant execute on function public.get_public_maintenance_records(uuid) to anon, authenticated;
