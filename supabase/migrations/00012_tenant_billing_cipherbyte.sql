-- 00012_tenant_billing_cipherbyte.sql
-- Electronic Invoicing & SRI integration via CipherByte Gateway
-- Supports multi-tenant configuration, superadmin white-glove setup, and audit logging.

-- 1. Tenant Billing Configurations (Tax data & CipherByte API credentials per tenant)
CREATE TABLE IF NOT EXISTS public.tenant_billing_configs (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  ruc TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  tradename TEXT,
  address TEXT,
  establishment_code TEXT NOT NULL DEFAULT '001',
  emission_point_code TEXT NOT NULL DEFAULT '001',
  cipherbyte_api_key TEXT,
  environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'production')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  special_taxpayer_number TEXT,
  forced_accounting BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_billing_configs_set_updated_at
  BEFORE UPDATE ON public.tenant_billing_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tenant_billing_configs ENABLE ROW LEVEL SECURITY;

-- Superadmin full management
CREATE POLICY tenant_billing_configs_superadmin_all
  ON public.tenant_billing_configs
  FOR ALL
  TO authenticated
  USING (public.am_i_platform_admin())
  WITH CHECK (public.am_i_platform_admin());

-- Tenant members can view their own billing configuration
CREATE POLICY tenant_billing_configs_select_members
  ON public.tenant_billing_configs
  FOR SELECT
  TO authenticated
  USING (tenant_id = ANY(public.get_my_tenant_ids()));

-- 2. Invoices table (Auditable history of electronic invoices emitted via CipherByte)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  reference_id UUID,
  reference_type TEXT DEFAULT 'general',
  invoice_number TEXT NOT NULL,
  access_key TEXT,
  authorization_number TEXT,
  authorization_date TIMESTAMPTZ,
  customer_tax_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  iva_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'authorized', 'rejected', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sri_response JSONB,
  pdf_url TEXT,
  xml_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Superadmin full management
CREATE POLICY invoices_superadmin_all
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (public.am_i_platform_admin())
  WITH CHECK (public.am_i_platform_admin());

-- Tenant members can select invoices for their tenant
CREATE POLICY invoices_select_members
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (tenant_id = ANY(public.get_my_tenant_ids()));

-- Tenant members can insert invoices for their tenant
CREATE POLICY invoices_insert_members
  ON public.invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = ANY(public.get_my_tenant_ids()));

-- Tenant members can update invoices for their tenant
CREATE POLICY invoices_update_members
  ON public.invoices
  FOR UPDATE
  TO authenticated
  USING (tenant_id = ANY(public.get_my_tenant_ids()))
  WITH CHECK (tenant_id = ANY(public.get_my_tenant_ids()));

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_access_key ON public.invoices (access_key);
CREATE INDEX IF NOT EXISTS idx_invoices_reference ON public.invoices (reference_id);
