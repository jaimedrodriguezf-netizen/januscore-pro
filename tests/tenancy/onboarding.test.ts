import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { onboardNewTenant } from '@/lib/tenancy/onboarding';

describe('Self-Serve Tenant Onboarding', () => {
  it('throws error when name is empty or missing', async () => {
    const supabase = {} as SupabaseClient;
    await expect(onboardNewTenant(supabase, { name: '   ' })).rejects.toThrow(
      'El nombre de la empresa o taller es obligatorio'
    );
  });

  it('calls onboard_new_tenant RPC with correct parameters', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: 'tenant-uuid-123', error: null });
    const supabase = { rpc: mockRpc } as unknown as SupabaseClient;

    const result = await onboardNewTenant(supabase, {
      name: 'Taller Mecánico Central',
      slug: 'taller-central',
      businessType: 'mechanics',
    });

    expect(result.tenantId).toBe('tenant-uuid-123');
    expect(mockRpc).toHaveBeenCalledWith('onboard_new_tenant', {
      p_name: 'Taller Mecánico Central',
      p_slug: 'taller-central',
      p_business_type: 'mechanics',
    });
  });

  it('defaults businessType to mechanics and slug to null when omitted', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: 'tenant-uuid-456', error: null });
    const supabase = { rpc: mockRpc } as unknown as SupabaseClient;

    const result = await onboardNewTenant(supabase, {
      name: 'Solo Nombre',
    });

    expect(result.tenantId).toBe('tenant-uuid-456');
    expect(mockRpc).toHaveBeenCalledWith('onboard_new_tenant', {
      p_name: 'Solo Nombre',
      p_slug: null,
      p_business_type: 'mechanics',
    });
  });

  it('propagates Supabase RPC errors', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') });
    const supabase = { rpc: mockRpc } as unknown as SupabaseClient;

    await expect(
      onboardNewTenant(supabase, { name: 'Falla DB' })
    ).rejects.toThrow('Database error');
  });
});
