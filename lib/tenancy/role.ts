import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Role resolution helper. Wraps the `get_my_role` security-definer function
 * defined in `supabase/migrations/00001_tenants.sql` and `00008_client_role.sql`.
 * Returns the highest role the current user holds for a tenant:
 * 'platform_admin', 'tenant_admin', 'operator', 'client', or '' when no access.
 */
export type TenancyRole = 'platform_admin' | 'tenant_admin' | 'operator' | 'client' | '';

const VALID_ROLES: TenancyRole[] = [
  'platform_admin',
  'tenant_admin',
  'operator',
  'client',
];

export async function getMyRole(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<TenancyRole> {
  const { data, error } = await supabase.rpc('get_my_role', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  const role = (data ?? '') as string;
  return VALID_ROLES.includes(role as TenancyRole)
    ? (role as TenancyRole)
    : '';
}
