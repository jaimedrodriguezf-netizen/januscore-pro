import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addTenantMemberByEmail } from '@/lib/admin/members';

describe('Admin Member Management (addTenantMemberByEmail)', () => {
  it('throws error when email is empty or whitespace', async () => {
    const supabase = {} as SupabaseClient;
    await expect(
      addTenantMemberByEmail(supabase, {
        tenantId: 'tenant-1',
        email: '   ',
        role: 'operator',
      })
    ).rejects.toThrow('El correo electrónico es obligatorio');
  });

  it('calls add_tenant_member_by_email RPC with trimmed email and correct params', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: 'user-uuid-999', error: null });
    const supabase = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await addTenantMemberByEmail(supabase, {
      tenantId: 'tenant-123',
      email: '  Mecanico@Taller.com  ',
      role: 'operator',
      branchId: 'branch-456',
    });

    expect(res.userId).toBe('user-uuid-999');
    expect(mockRpc).toHaveBeenCalledWith('add_tenant_member_by_email', {
      p_tenant_id: 'tenant-123',
      p_email: 'mecanico@taller.com',
      p_role: 'operator',
      p_branch_id: 'branch-456',
    });
  });

  it('defaults branchId to null when omitted', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: 'user-uuid-888', error: null });
    const supabase = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await addTenantMemberByEmail(supabase, {
      tenantId: 'tenant-123',
      email: 'cliente@gmail.com',
      role: 'client',
    });

    expect(res.userId).toBe('user-uuid-888');
    expect(mockRpc).toHaveBeenCalledWith('add_tenant_member_by_email', {
      p_tenant_id: 'tenant-123',
      p_email: 'cliente@gmail.com',
      p_role: 'client',
      p_branch_id: null,
    });
  });

  it('propagates Supabase RPC error', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('No se encontró ningún usuario registrado con ese correo'),
    });
    const supabase = { rpc: mockRpc } as unknown as SupabaseClient;

    await expect(
      addTenantMemberByEmail(supabase, {
        tenantId: 'tenant-123',
        email: 'inexistente@gmail.com',
        role: 'operator',
      })
    ).rejects.toThrow('No se encontró ningún usuario registrado con ese correo');
  });
});
