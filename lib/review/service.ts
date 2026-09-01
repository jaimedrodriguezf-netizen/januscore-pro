import type { SupabaseClient } from '@supabase/supabase-js';
import { assertValidTransition, ReceiptStatus } from './state-machine';
import { logAudit } from './audit';

export class SelfApprovalError extends Error {
  constructor(message = 'Uploader cannot approve or reject own receipt (separation of duties)') {
    super(message);
    this.name = 'SelfApprovalError';
  }
}

export interface ReviewReceiptParams {
  receiptId: string;
  actorId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ReceiptReviewResult {
  id: string;
  status: ReceiptStatus;
  reviewed_by: string;
  reviewed_at: string;
  rejection_reason?: string | null;
}

export async function reviewReceipt(
  supabase: SupabaseClient,
  params: {
    receiptId: string;
    actorId: string;
    action: 'approve' | 'reject';
    reason?: string;
  },
): Promise<ReceiptReviewResult> {
  const { data: receipt, error: fetchErr } = await supabase
    .from('receipts')
    .select('id, tenant_id, branch_id, uploaded_by, status, fraud_flag')
    .eq('id', params.receiptId)
    .single();

  if (fetchErr || !receipt) {
    throw new Error(`Receipt not found: ${fetchErr?.message ?? params.receiptId}`);
  }

  // R7: Second-person review enforcement (separation of duties)
  if (receipt.uploaded_by === params.actorId) {
    throw new SelfApprovalError();
  }

  const targetStatus: ReceiptStatus = params.action === 'approve' ? 'approved' : 'rejected';
  assertValidTransition(receipt.status as ReceiptStatus, targetStatus);

  const now = new Date().toISOString();
  const updatePayload = {
    status: targetStatus,
    reviewed_by: params.actorId,
    reviewed_at: now,
    rejection_reason: params.action === 'reject' ? (params.reason ?? null) : null,
  };

  const { data: updated, error: updateErr } = await supabase
    .from('receipts')
    .update(updatePayload)
    .eq('id', params.receiptId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(`Failed to update receipt: ${updateErr?.message}`);
  }

  // R6 & R8: Append immutable audit log entry
  await logAudit(supabase, {
    tenantId: receipt.tenant_id,
    branchId: receipt.branch_id,
    actorId: params.actorId,
    targetType: 'receipt',
    targetId: params.receiptId,
    action: targetStatus,
    metadata: {
      from_status: receipt.status,
      to_status: targetStatus,
      uploaded_by: receipt.uploaded_by,
      reviewed_by: params.actorId,
      rejection_reason: updatePayload.rejection_reason,
      fraud_flag: receipt.fraud_flag,
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    reviewed_by: updated.reviewed_by,
    reviewed_at: updated.reviewed_at,
    rejection_reason: updated.rejection_reason,
  };
}
