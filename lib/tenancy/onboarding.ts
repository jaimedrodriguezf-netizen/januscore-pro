import type { SupabaseClient } from '@supabase/supabase-js';

export interface OnboardTenantInput {
  name: string;
  slug?: string;
  businessType?: 'all' | 'mechanics' | 'financial_receipts';
}

export async function onboardNewTenant(
  supabase: SupabaseClient,
  input: OnboardTenantInput
): Promise<{ tenantId: string }> {
  const trimmedName = input.name?.trim() ?? '';
  if (!trimmedName) {
    throw new Error('El nombre de la empresa o taller es obligatorio');
  }

  const { data, error } = await supabase.rpc('onboard_new_tenant', {
    p_name: trimmedName,
    p_slug: input.slug?.trim() || null,
    p_business_type: input.businessType || 'mechanics',
  });

  if (error) {
    throw error;
  }

  return { tenantId: data as string };
}
