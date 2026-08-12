import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage layer for original receipt files (R1).
 *
 * Bucket: `receipts-original` (private, RLS-protected).
 * Path convention: `<tenant_id>/<branch_id>/<YYYY>/<MM>/<uuid>`
 *
 * Immutability is structural: every object key ends in a fresh uuid, so a later
 * upload never overwrites an existing object (the app layer passes `upsert:
 * false`). A SHA-256 digest is computed server-side from the uploaded bytes and
 * persisted on the `receipts`/`receipt_files` rows as a byte-for-byte
 * fingerprint of the original.
 */

export const RECEIPTS_BUCKET = 'receipts-original';

export interface UploadReceiptOriginalInput {
  tenantId: string;
  branchId: string;
  fileId: string; // fresh uuid; makes the object key unique (immutable, no overwrite)
  file: File | Blob | ArrayBuffer | Uint8Array;
  contentType: string;
  originalFilename: string;
}

export interface UploadedFile {
  path: string;
  sha256: string;
  size: number;
  mimeType: string;
  originalFilename: string;
}

/**
 * Build the canonical immutable storage path for an original receipt file:
 * `<tenant_id>/<branch_id>/<YYYY>/<MM>/<uuid>`.
 */
export function buildStoragePath(
  tenantId: string,
  branchId: string,
  fileId: string,
  now: Date = new Date(),
): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return [tenantId, branchId, yyyy, mm, fileId].join('/');
}

/** Read the bytes of any supported upload payload and hash them with SHA-256. */
async function toBytesAndDigest(
  file: UploadReceiptOriginalInput['file'],
): Promise<{ bytes: Uint8Array; sha256: string; size: number }> {
  let bytes: Uint8Array;
  if (file instanceof ArrayBuffer) {
    bytes = new Uint8Array(file);
  } else if (ArrayBuffer.isView(file)) {
    const view = file as Uint8Array;
    // Copy the viewed region so a SharedArrayBuffer-backed view becomes a
    // standalone ArrayBuffer-backed Uint8Array (digestable by node:crypto).
    bytes = new Uint8Array(view.byteLength);
    bytes.set(view);
  } else {
    bytes = new Uint8Array(await file.arrayBuffer());
  }
  // node:crypto accepts ArrayBufferView (Uint8Array) regardless of buffer kind.
  const digest = createHash('sha256').update(bytes).digest('hex');
  return { bytes, sha256: digest, size: bytes.byteLength };
}

/**
 * Upload an original receipt file to the private `receipts-original` bucket
 * using the authenticated server client so Storage INSERT RLS is enforced as
 * the uploading user. `upsert: false` guarantees the object is created once
 * and never overwritten (R1 immutability).
 */
export async function uploadReceiptOriginal(
  supabase: SupabaseClient,
  input: UploadReceiptOriginalInput,
): Promise<UploadedFile> {
  const { bytes, sha256, size } = await toBytesAndDigest(input.file);
  const path = buildStoragePath(input.tenantId, input.branchId, input.fileId);

  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, bytes, {
      contentType: input.contentType,
      upsert: false,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`storage upload failed for ${path}: ${error.message}`);
  }

  return {
    path,
    sha256,
    size,
    mimeType: input.contentType,
    originalFilename: input.originalFilename,
  };
}