-- 00011_tenant_modules.sql
-- Add business_type and modules to tenants for role-based module assignment

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'all' CHECK (business_type IN ('all', 'mechanics', 'financial_receipts')),
ADD COLUMN IF NOT EXISTS modules TEXT[] NOT NULL DEFAULT ARRAY['mechanics', 'financial_receipts'];

-- Helper RPC for superadmin or authenticated users to fetch tenant business type
CREATE OR REPLACE FUNCTION public.get_tenant_business_type(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT business_type FROM public.tenants WHERE id = p_tenant_id;
$$;
