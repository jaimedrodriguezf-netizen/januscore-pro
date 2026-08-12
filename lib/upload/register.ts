import type { SupabaseClient } from '@supabase/supabase-js';
import { canAccessBranch } from '@/lib/tenancy/branch';
import type { UploadedFile } from '@/lib/upload/storage';

/**
 * Receipt registration (R1): after the original file is stored immutably, the
 * logical `receipts` row (status=pending) plus its `receipt_files` original
 * row are inserted through the authenticated server client, so table RLS is
 * enforced as the uploading user.
 *
 * Defense in depth: branch membership is checked in the app layer BEFORE the
 * insert, and again by the `receipts_insert` RLS policy. Either gate rejecting
 * the request yields an authorization error (test 2.6).
 *
 * Audit logging (R8) is deferred to Phase 5: the `audit_logs` table does not
 * exist until `00005_audit.sql`. This function is audit-ready (the actor is
 * `uploadedBy` and is persisted on the receipt now); Phase 5 wires the actual
 * append-only audit write without changing this call site.
 */

export interface RegisterReceiptInput {
  tenantId: string;
  branchId: string;
  uploadedBy: string; // auth.uid() of the operator
}

export interface RegisteredReceipt {
  id: string;
  status: string;
  storagePath: string;
}

/**
 * Register a pending receipt and its original file record. Throws on any
 * authorization or persistence failure; never silently returns a partial row.
 */
export async function registerReceipt(
  supabase: SupabaseClient,
  actor: RegisterReceiptInput,
  uploaded: UploadedFile,
): Promise<RegisteredReceipt> {
  // App-layer authorization gate (mirrors receipts_insert RLS policy).
  const allowed = await canAccessBranch(supabase, actor.branchId, actor.tenantId);
  if (!allowed) {
    throw new AuthorizationError(
      `User is not a member of branch ${actor.branchId}.`,
    );
  }

  const { data: receipt, error } = await supabase
    .from('receipts')
    .insert({
      tenant_id: actor.tenantId,
      branch_id: actor.branchId,
      uploaded_by: actor.uploadedBy,
      status: 'pending',
      storage_path: uploaded.path,
      original_filename: uploaded.originalFilename,
      mime_type: uploaded.mimeType,
      file_size: uploaded.size,
      file_sha256: uploaded.sha256,
    })
    .select('id, status, storage_path')
    .single();

  if (error || !receipt) {
    throw new Error(`receipts insert failed: ${error?.message ?? 'no row returned'}`);
  }

  const { error: fileErr } = await supabase
    .from('receipt_files')
    .insert({
      receipt_id: receipt.id,
      storage_path: uploaded.path,
      original_filename: uploaded.originalFilename,
      mime_type: uploaded.mimeType,
      file_size: uploaded.size,
      file_sha256: uploaded.sha256,
      is_original: true,
    });

  if (fileErr) {
    // Non-fatal: the immutable original is already in Storage and the receipts
    // row exists; the derived-file index can be repaired later. Surface it.
    throw new Error(`receipt_files insert failed: ${fileErr.message}`);
  }

  return {
    id: receipt.id,
    status: receipt.status,
    storagePath: receipt.storage_path!,
  };
}

/** Authorization failure (branch membership missing). Safe to surface to UI. */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}