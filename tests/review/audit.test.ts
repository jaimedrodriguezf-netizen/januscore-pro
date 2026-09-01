import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logAudit, AuditEntry } from '@/lib/review/audit';

describe('Audit Logger (R8)', () => {
  it('inserts an audit log entry with required metadata', async () => {
    let inserted: Record<string, unknown> | null = null;
    const client = {
      from: vi.fn((table: string) => {
        expect(table).toBe('audit_logs');
        return {
          insert: vi.fn((payload: Record<string, unknown>) => {
            inserted = payload;
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: 'audit-uuid', ...payload }, error: null }),
            };
          }),
        };
      }),
    } as unknown as SupabaseClient;

    const entry: AuditEntry = {
      tenantId: 'tenant-123',
      branchId: 'branch-456',
      actorId: 'user-789',
      targetType: 'receipt',
      targetId: 'receipt-999',
      action: 'state_transition',
      metadata: { from: 'pending', to: 'needs_review' },
    };

    await logAudit(client, entry);

    expect(inserted).not.toBeNull();
    expect(inserted).toMatchObject({
      tenant_id: 'tenant-123',
      branch_id: 'branch-456',
      actor_id: 'user-789',
      target_type: 'receipt',
      target_id: 'receipt-999',
      action: 'state_transition',
      metadata: { from: 'pending', to: 'needs_review' },
    });
  });
});
