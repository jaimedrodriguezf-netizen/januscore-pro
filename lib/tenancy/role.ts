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

export type UserDisplayRole =
  | 'platform_admin'
  | 'tenant_admin'
  | 'operator'
  | 'client'
  | 'unassigned';

export interface UserRoleInfo {
  role: UserDisplayRole;
  label: string;
  badgeColor: string;
  isPlatformAdmin: boolean;
  tenantId?: string;
  businessType: 'all' | 'mechanics' | 'financial_receipts';
}

export async function getUserRoleInfo(
  supabase: SupabaseClient,
  tenantId?: string
): Promise<UserRoleInfo> {
  try {
    const { data: isPlatformAdmin } = await supabase.rpc('am_i_platform_admin');
    if (isPlatformAdmin) {
      return {
        role: 'platform_admin',
        label: '👑 Superadmin',
        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        isPlatformAdmin: true,
        businessType: 'all',
      };
    }

    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const { data: tenantIds } = await supabase.rpc('get_my_tenant_ids');
      if (Array.isArray(tenantIds) && tenantIds.length > 0) {
        targetTenantId = tenantIds[0];
      }
    }

    if (targetTenantId) {
      let businessType: 'all' | 'mechanics' | 'financial_receipts' = 'all';
      try {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('business_type')
          .eq('id', targetTenantId)
          .maybeSingle();
        if (tenant?.business_type) {
          businessType = tenant.business_type as 'all' | 'mechanics' | 'financial_receipts';
        }
      } catch {
        // Fallback to 'all' if table query fails
      }

      const role = await getMyRole(supabase, targetTenantId);
      if (role === 'tenant_admin') {
        return {
          role: 'tenant_admin',
          label: '🏢 Admin de Empresa',
          badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          isPlatformAdmin: false,
          tenantId: targetTenantId,
          businessType,
        };
      }
      if (role === 'operator') {
        return {
          role: 'operator',
          label: '🔧 Operador / Taller',
          badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          isPlatformAdmin: false,
          tenantId: targetTenantId,
          businessType,
        };
      }
      if (role === 'client') {
        return {
          role: 'client',
          label: '👤 Cliente',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          isPlatformAdmin: false,
          tenantId: targetTenantId,
          businessType,
        };
      }
    }
  } catch {
    // Graceful fallback
  }

  return {
    role: 'unassigned',
    label: '⏳ Sin Organización',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    isPlatformAdmin: false,
    businessType: 'all',
  };
}
