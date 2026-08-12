import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Branch-scoped access helpers. Wrappers over the `get_my_branch_ids`
 * security-definer function defined in `supabase/migrations/00001_tenants.sql`.
 * Branch-level isolation (R16) is enforced here on top of tenant RLS.
 */

/**
 * Branch ids the current user may access. Pass `tenantId` to scope to one
 * tenant; omit to receive every accessible branch across all tenants.
 */
export async function getAccessibleBranchIds(
  supabase: SupabaseClient,
  tenantId?: string,
): Promise<string[]> {
  const params = tenantId ? { p_tenant_id: tenantId } : {};
  const { data, error } = await supabase.rpc('get_my_branch_ids', params);
  if (error) throw error;
  return (data ?? []) as string[];
}

/** True if the current user may operate on the given branch. */
export async function canAccessBranch(
  supabase: SupabaseClient,
  branchId: string,
  tenantId?: string,
): Promise<boolean> {
  const ids = await getAccessibleBranchIds(supabase, tenantId);
  return ids.includes(branchId);
}