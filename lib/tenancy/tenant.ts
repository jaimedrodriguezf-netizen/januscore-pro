import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Tenant-scoped access helpers. Thin RPC wrappers over the `get_my_tenant_ids`
 * and `am_i_tenant_admin` security-definer functions defined in
 * `supabase/migrations/00001_tenants.sql`. Resolved server-side, so the result
 * already reflects the authenticated user's RLS context (R16).
 */

/** Tenant ids the current user may access (membership or platform admin). */
export async function getAccessibleTenantIds(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_my_tenant_ids');
  if (error) throw error;
  return (data ?? []) as string[];
}

/** True if the current user is the tenant admin for the given tenant. */
export async function amITenantAdmin(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('am_i_tenant_admin', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return Boolean(data);
}

/** True if the current user may access the given tenant at any role. */
export async function canAccessTenant(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<boolean> {
  const ids = await getAccessibleTenantIds(supabase);
  return ids.includes(tenantId);
}