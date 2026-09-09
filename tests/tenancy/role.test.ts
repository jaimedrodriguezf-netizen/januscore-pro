import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMyRole, getUserRoleInfo } from '@/lib/tenancy/role';

describe('Tenancy Role Resolution (R13)', () => {
  function createMockSupabase(rpcResult: { data: string | null; error: Error | null }) {
    return {
      rpc: vi.fn((fnName: string, _params: Record<string, unknown>) => {
        if (fnName === 'get_my_role') {
          return Promise.resolve(rpcResult);
        }
        throw new Error(`Unexpected RPC call: ${fnName}`);
      }),
    } as unknown as SupabaseClient;
  }

  it('resolves "client" role correctly', async () => {
    const supabase = createMockSupabase({ data: 'client', error: null });
    const role = await getMyRole(supabase, 'tenant-123');
    expect(role).toBe('client');
  });

  it('resolves "operator" role correctly', async () => {
    const supabase = createMockSupabase({ data: 'operator', error: null });
    const role = await getMyRole(supabase, 'tenant-123');
    expect(role).toBe('operator');
  });

  it('resolves "tenant_admin" role correctly', async () => {
    const supabase = createMockSupabase({ data: 'tenant_admin', error: null });
    const role = await getMyRole(supabase, 'tenant-123');
    expect(role).toBe('tenant_admin');
  });

  it('resolves "platform_admin" role correctly', async () => {
    const supabase = createMockSupabase({ data: 'platform_admin', error: null });
    const role = await getMyRole(supabase, 'tenant-123');
    expect(role).toBe('platform_admin');
  });

  it('resolves unknown or empty role to empty string ""', async () => {
    const supabaseInvalid = createMockSupabase({ data: 'unknown_role', error: null });
    expect(await getMyRole(supabaseInvalid, 'tenant-123')).toBe('');

    const supabaseNull = createMockSupabase({ data: null, error: null });
    expect(await getMyRole(supabaseNull, 'tenant-123')).toBe('');
  });

  it('propagates RPC error when get_my_role fails', async () => {
    const rpcError = new Error('RPC failed');
    const supabase = createMockSupabase({ data: null, error: rpcError });
    await expect(getMyRole(supabase, 'tenant-123')).rejects.toThrow('RPC failed');
  });
});

describe('User Role Display Info (getUserRoleInfo)', () => {
  it('returns Superadmin when am_i_platform_admin is true', async () => {
    const supabase = {
      rpc: vi.fn((fn: string) => {
        if (fn === 'am_i_platform_admin') return Promise.resolve({ data: true, error: null });
        return Promise.resolve({ data: null, error: null });
      }),
    } as unknown as SupabaseClient;

    const info = await getUserRoleInfo(supabase);
    expect(info.role).toBe('platform_admin');
    expect(info.label).toBe('👑 Superadmin');
    expect(info.isPlatformAdmin).toBe(true);
    expect(info.businessType).toBe('all');
  });

  it('returns Admin de Empresa when role is tenant_admin and resolves businessType from tenant', async () => {
    const supabase = {
      rpc: vi.fn((fn: string) => {
        if (fn === 'am_i_platform_admin') return Promise.resolve({ data: false, error: null });
        if (fn === 'get_my_role') return Promise.resolve({ data: 'tenant_admin', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
      from: vi.fn((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: { business_type: 'mechanics' }, error: null })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as SupabaseClient;

    const info = await getUserRoleInfo(supabase, 'tenant-1');
    expect(info.role).toBe('tenant_admin');
    expect(info.label).toBe('🏢 Admin de Empresa');
    expect(info.isPlatformAdmin).toBe(false);
    expect(info.tenantId).toBe('tenant-1');
    expect(info.businessType).toBe('mechanics');
  });

  it('returns Operador when role is operator and resolves financial_receipts businessType', async () => {
    const supabase = {
      rpc: vi.fn((fn: string) => {
        if (fn === 'am_i_platform_admin') return Promise.resolve({ data: false, error: null });
        if (fn === 'get_my_role') return Promise.resolve({ data: 'operator', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
      from: vi.fn((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: { business_type: 'financial_receipts' }, error: null })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as SupabaseClient;

    const info = await getUserRoleInfo(supabase, 'tenant-1');
    expect(info.role).toBe('operator');
    expect(info.label).toBe('🔧 Operador / Taller');
    expect(info.businessType).toBe('financial_receipts');
  });

  it('returns Cliente when role is client', async () => {
    const supabase = {
      rpc: vi.fn((fn: string) => {
        if (fn === 'am_i_platform_admin') return Promise.resolve({ data: false, error: null });
        if (fn === 'get_my_role') return Promise.resolve({ data: 'client', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
    } as unknown as SupabaseClient;

    const info = await getUserRoleInfo(supabase, 'tenant-1');
    expect(info.role).toBe('client');
    expect(info.label).toBe('👤 Cliente');
  });

  it('auto-resolves tenantId via get_my_tenant_ids when omitted', async () => {
    const supabase = {
      rpc: vi.fn((fn: string) => {
        if (fn === 'am_i_platform_admin') return Promise.resolve({ data: false, error: null });
        if (fn === 'get_my_tenant_ids') return Promise.resolve({ data: ['auto-tenant'], error: null });
        if (fn === 'get_my_role') return Promise.resolve({ data: 'operator', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
      from: vi.fn((table: string) => {
        if (table === 'tenants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: { business_type: 'mechanics' }, error: null })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as SupabaseClient;

    const info = await getUserRoleInfo(supabase);
    expect(info.role).toBe('operator');
    expect(info.label).toBe('🔧 Operador / Taller');
    expect(info.tenantId).toBe('auto-tenant');
    expect(info.businessType).toBe('mechanics');
  });

  it('returns Sin Organización when user has no tenant memberships', async () => {
    const supabase = {
      rpc: vi.fn((fn: string) => {
        if (fn === 'am_i_platform_admin') return Promise.resolve({ data: false, error: null });
        if (fn === 'get_my_tenant_ids') return Promise.resolve({ data: [], error: null });
        return Promise.resolve({ data: null, error: null });
      }),
    } as unknown as SupabaseClient;

    const info = await getUserRoleInfo(supabase);
    expect(info.role).toBe('unassigned');
    expect(info.label).toBe('⏳ Sin Organización');
    expect(info.isPlatformAdmin).toBe(false);
    expect(info.businessType).toBe('all');
  });
});
