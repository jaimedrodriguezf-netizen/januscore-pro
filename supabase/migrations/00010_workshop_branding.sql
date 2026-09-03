-- 00010_workshop_branding.sql
-- Adds branding and contact columns to tenants for workshop profile customization

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS operating_hours TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Policy to allow public read of active tenant basic branding for public portal
CREATE POLICY "tenants_public_read_branding"
ON public.tenants
FOR SELECT
TO anon, authenticated
USING (is_active = true);
