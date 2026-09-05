'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { onboardNewTenant } from '@/lib/tenancy/onboarding';

export interface OnboardActionResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

export async function onboardTenantAction(formData: FormData): Promise<OnboardActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para configurar una empresa.' };
    }

    const name = String(formData.get('name') || '').trim();
    const slug = String(formData.get('slug') || '').trim();
    const businessType = String(formData.get('businessType') || 'mechanics') as 'all' | 'mechanics' | 'financial_receipts';

    if (!name) {
      return { success: false, error: 'El nombre de la empresa o taller es obligatorio.' };
    }

    const { tenantId } = await onboardNewTenant(supabase, {
      name,
      slug: slug || undefined,
      businessType,
    });

    revalidatePath('/');
    return { success: true, tenantId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear la organización';
    return { success: false, error: message };
  }
}
