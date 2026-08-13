import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type OcrEngine,
  type OcrExtractionOutput,
  isOcrExtractionError,
  OcrExtractionFailedError,
} from './engine';
import { OCR_FIELD_KEYS } from './tesseract';
import { RECEIPTS_BUCKET } from '@/lib/upload/storage';

/**
 * R2 / R5 — extraction orchestration (lib/ocr/pipeline.ts).
 *
 * `buildExtractionRow` and `classifyExtraction` are PURE: they map any
 * `OcrEngine` output to the `extraction_results` persistence shape, independent
 * of WHICH engine produced it. That is the R2 RED contract: swapping the engine
 * does not change the persisted shape, only the values (tests/ocr/tesseract.test.ts).
 *
 * `runExtractionPipeline` is the integration boundary: it downloads the
 * immutable Storage object to a temp file, calls the injected `OcrEngine`,
 * persists an `extraction_results` row, and transitions `receipts.status` —
 * `needs_review` on partial, unchanged (`pending`) on complete (R2 forbids
 * auto-approve; QR/Ed25519/beneficiary/review arrive in Phases 4–5). On any
 * `OcrExtractionError` it persists a `failed` row and leaves the receipt
 * `pending` (threat matrix: missing/hanging binary → graceful error, never
 * auto-reject). It uses the SERVICE client inside `after` (bypasses RLS) and
 * is a no-op (throws) when the service env is unconfigured — tests skip cleanly.
 */

export type ExtractionStatus = 'complete' | 'partial' | 'failed';

export interface ExtractionRow {
  receipt_id: string;
  tenant_id: string;
  branch_id: string;
  engine_name: string;
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  raw_text: string;
  status: ExtractionStatus;
}

/** Classify an engine's output as complete (every R2 field present) or partial. */
export function classifyExtraction(output: OcrExtractionOutput): 'complete' | 'partial' {
  const present = OCR_FIELD_KEYS.filter((k) => output.fields[k] != null).length;
  if (present === OCR_FIELD_KEYS.length && output.rawText.length > 0) return 'complete';
  return 'partial';
}

/** Pure mapping of an engine output to the extraction_results row shape (R2). */
export function buildExtractionRow(args: {
  receiptId: string;
  tenantId: string;
  branchId: string;
  engineName: string;
  output: OcrExtractionOutput;
  status: ExtractionStatus;
}): ExtractionRow {
  return {
    receipt_id: args.receiptId,
    tenant_id: args.tenantId,
    branch_id: args.branchId,
    engine_name: args.engineName,
    fields: { ...args.output.fields },
    confidence: { ...args.output.confidence },
    raw_text: args.output.rawText,
    status: args.status,
  };
}

export interface RunExtractionPipelineArgs {
  engine: OcrEngine;
  receiptId: string;
  tenantId: string;
  branchId: string;
  storagePath: string;
  mime: string;
  /** Service-role client (bypasses RLS). Tests pass a mock. */
  supabase: SupabaseClient;
}

export interface RunExtractionPipelineResult {
  status: ExtractionStatus;
  row: ExtractionRow;
}

export async function runExtractionPipeline(
  args: RunExtractionPipelineArgs,
): Promise<RunExtractionPipelineResult> {
  const localPath = await downloadToLocalTemp(args.supabase, args.storagePath, args.mime);
  try {
    let status: ExtractionStatus;
    let output: OcrExtractionOutput;
    try {
      output = await args.engine.extract({ path: localPath, mime: args.mime });
      status = classifyExtraction(output);
    } catch (err) {
      // Threat matrix: structured error persisted; receipt stays pending (no
      // auto-reject). Persist a `failed` row with the error code surfaced.
      const code = isOcrExtractionError(err) ? err.code : 'ocr_failed';
      const message = err instanceof Error ? err.message : String(err);
      status = 'failed';
      output = {
        fields: { ...Object.fromEntries(OCR_FIELD_KEYS.map((k) => [k, null])) },
        confidence: {},
        rawText: `[ocr-failed ${code}] ${message}`,
      };
    }

    const row = buildExtractionRow({
      receiptId: args.receiptId,
      tenantId: args.tenantId,
      branchId: args.branchId,
      engineName: args.engine.name,
      output,
      status,
    });

    await persistRow(args.supabase, row);

    // Status transition: partial → needs_review (R2 poor-quality scenario).
    // complete / failed → leave pending (QR/review arrive in Phases 4–5; R2
    // forbids auto-approve; threat matrix forbids auto-reject).
    if (status === 'partial') {
      await args.supabase
        .from('receipts')
        .update({ status: 'needs_review' })
        .eq('id', args.receiptId);
    }

    return { status, row };
  } finally {
    await rm(localPath, { force: true });
  }
}

async function downloadToLocalTemp(
  supabase: SupabaseClient,
  storagePath: string,
  mime: string,
): Promise<string> {
  const ext = extensionForMime(mime);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ocr-extract-'));
  const file = path.join(dir, `input${ext}`);
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .download(storagePath);
  if (error || !data) {
    throw new OcrExtractionFailedError(
      `storage download failed for ${storagePath}: ${error?.message ?? 'no body'}`,
    );
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  await writeFile(file, bytes);
  return file;
}

function extensionForMime(mime: string): string {
  if (mime === 'application/pdf') return '.pdf';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  if (mime === 'image/tiff' || mime === 'image/tif') return '.tif';
  if (mime === 'image/webp') return '.webp';
  return '.bin';
}

async function persistRow(
  supabase: SupabaseClient,
  row: ExtractionRow,
): Promise<void> {
  const { error } = await supabase.from('extraction_results').insert({
    receipt_id: row.receipt_id,
    tenant_id: row.tenant_id,
    branch_id: row.branch_id,
    engine_name: row.engine_name,
    fields: row.fields,
    confidence: row.confidence,
    raw_text: row.raw_text,
    status: row.status,
    completed_at: new Date().toISOString(),
  });
  if (error) {
    throw new OcrExtractionFailedError(`extraction_results insert failed: ${error.message}`);
  }
}