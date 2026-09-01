import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMyRole } from '@/lib/tenancy/role';

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
