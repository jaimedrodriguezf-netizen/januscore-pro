import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { reviewReceipt, SelfApprovalError } from '@/lib/review/service';
import { matchBeneficiary } from '@/lib/review/beneficiary';

describe('Review Service — Second-Person Review & Validation (R5, R7)', () => {
  const uploaderId = 'user-uploader-123';
  const reviewerId = 'user-reviewer-456';
  const tenantId = 'tenant-789';
  const branchId = 'branch-012';
  const receiptId = 'receipt-345';

  function createMockSupabase(receiptState: {
    id: string;
    uploaded_by: string;
    status: string;
    tenant_id: string;
    branch_id: string;
    fraud_flag: boolean;
  }) {
    let updatedPayload: Record<string, unknown> | null = null;
    const insertedAudit: Record<string, unknown>[] = [];

    const client = {
      from: vi.fn((table: string) => {
        if (table === 'receipts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((col: string, val: string) => {
              if (col === 'id' && val === receiptState.id) {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({ data: receiptState, error: null }),
                  single: vi.fn().mockResolvedValue({ data: receiptState, error: null }),
                };
              }
              return { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
            }),
            update: vi.fn((payload: Record<string, unknown>) => {
              updatedPayload = payload;
              return {
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { ...receiptState, ...payload },
                  error: null,
                }),
              };
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn((payload: Record<string, unknown>) => {
              insertedAudit.push(payload);
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'audit-1', ...payload }, error: null }),
              };
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    return { client, getUpdatedPayload: () => updatedPayload, getInsertedAudit: () => insertedAudit };
  }

  it('5.7 RED: blocks self-approval when actor is the uploader (R7)', async () => {
    const { client } = createMockSupabase({
      id: receiptId,
      uploaded_by: uploaderId,
      status: 'needs_review',
      tenant_id: tenantId,
      branch_id: branchId,
      fraud_flag: false,
    });

    await expect(
      reviewReceipt(client, {
        receiptId,
        actorId: uploaderId, // Attempting self-approval
        action: 'approve',
      }),
    ).rejects.toThrow(SelfApprovalError);
  });

  it('5.7 RED: blocks self-rejection when actor is the uploader (R7)', async () => {
    const { client } = createMockSupabase({
      id: receiptId,
      uploaded_by: uploaderId,
      status: 'pending',
      tenant_id: tenantId,
      branch_id: branchId,
      fraud_flag: false,
    });

    await expect(
      reviewReceipt(client, {
        receiptId,
        actorId: uploaderId,
        action: 'reject',
        reason: 'Duplicate image',
      }),
    ).rejects.toThrow(SelfApprovalError);
  });

  it('succeeds when a second person (different reviewer) approves (R7)', async () => {
    const { client, getUpdatedPayload, getInsertedAudit } = createMockSupabase({
      id: receiptId,
      uploaded_by: uploaderId,
      status: 'needs_review',
      tenant_id: tenantId,
      branch_id: branchId,
      fraud_flag: false,
    });

    const result = await reviewReceipt(client, {
      receiptId,
      actorId: reviewerId,
      action: 'approve',
    });

    expect(result.status).toBe('approved');
    expect(result.reviewed_by).toBe(reviewerId);
    expect(getUpdatedPayload()?.status).toBe('approved');
    expect(getUpdatedPayload()?.reviewed_by).toBe(reviewerId);

    const audit = getInsertedAudit();
    expect(audit.length).toBe(1);
    expect(audit[0].action).toBe('approved');
    expect(audit[0].actor_id).toBe(reviewerId);
  });

  it('records rejection reason in receipt and audit trail (R6)', async () => {
    const { client, getUpdatedPayload, getInsertedAudit } = createMockSupabase({
      id: receiptId,
      uploaded_by: uploaderId,
      status: 'needs_review',
      tenant_id: tenantId,
      branch_id: branchId,
      fraud_flag: true,
    });

    const result = await reviewReceipt(client, {
      receiptId,
      actorId: reviewerId,
      action: 'reject',
      reason: 'Signature mismatch confirmed',
    });

    expect(result.status).toBe('rejected');
    expect(getUpdatedPayload()?.rejection_reason).toBe('Signature mismatch confirmed');
    expect(getInsertedAudit()[0].action).toBe('rejected');
  });

  it('5.9 RED: beneficiary mismatch flags review but does NOT throw or block approval (R5)', () => {
    const configuredAccounts = ['2200112233', '1100445566'];
    
    const match = matchBeneficiary('2200112233', configuredAccounts);
    expect(match.isMatch).toBe(true);
    expect(match.matchedAccount).toBe('2200112233');

    const mismatch = matchBeneficiary('9999999999', configuredAccounts);
    expect(mismatch.isMatch).toBe(false);
    expect(mismatch.matchedAccount).toBeUndefined();
  });
});
