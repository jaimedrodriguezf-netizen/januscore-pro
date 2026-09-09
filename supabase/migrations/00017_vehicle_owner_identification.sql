-- 00017_vehicle_owner_identification.sql
-- Add owner identification (cédula/RUC) and email to vehicles table for duplicate prevention and client lookup.

ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS owner_identification TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT;

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_owner_id
ON public.vehicles (tenant_id, owner_identification);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_owner_name
ON public.vehicles (tenant_id, owner_name);
