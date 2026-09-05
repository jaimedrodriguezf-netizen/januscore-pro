import type { SupabaseClient } from '@supabase/supabase-js';

export interface AddTenantMemberInput {
  tenantId: string;
  email: string;
  role: 'tenant_admin' | 'operator' | 'client';
  branchId?: string | null;
}

export async function addTenantMemberByEmail(
  supabase: SupabaseClient,
  input: AddTenantMemberInput
): Promise<{ userId: string }> {
  const trimmedEmail = input.email?.trim().toLowerCase() ?? '';
  if (!trimmedEmail) {
    throw new Error('El correo electrónico es obligatorio');
  }

  const { data, error } = await supabase.rpc('add_tenant_member_by_email', {
    p_tenant_id: input.tenantId,
    p_email: trimmedEmail,
    p_role: input.role,
    p_branch_id: input.branchId || null,
  });

  if (error) {
    throw error;
  }

  return { userId: data as string };
}
