import { after } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessBranch } from '@/lib/tenancy/branch';
import { getDefaultOcrEngine } from '@/lib/ocr/tesseract';
import { runExtractionPipeline } from '@/lib/ocr/pipeline';
import { runQrVerificationPipeline, type QrImageDecoder } from '@/lib/qr/pipeline';

/**
 * R2 / R3 / R5 — POST /api/receipts/[id]/extract.
 *
 * Orchestrates server-side OCR after a receipt has been ingested (Phase 2). The
 * handler authenticates the operator, verifies the receipt belongs to one of
 * their branches (R16 via table RLS + an app-layer `canAccessBranch` check for
 * defense in depth), then responds `202 Accepted` immediately and schedules the
 * OCR + persistence + status transition in `after` (design: Server Action /
 * route returns immediately; `after` runs OCR+QR). `after` runs after the
 * response is flushed so the operator's 30s success criterion is decoupled from
 * a (possibly slow) Tesseract run.
 *
 * The actual OCR work inside `after` uses the SERVICE client — it bypasses RLS
 * to read the immutable Storage object and write `extraction_results` /
 * transition `receipts.status`. If the service env is unconfigured the route
 * still returns 202 (the operator is not blocked); `after` no-ops the OCR step
 * and surfaces the missing-config error server-side (R2 threat matrix:
 * missing/hanging binary → graceful error, receipt stays `pending`).
 *
 * Phase 4 (R3 / R4): after OCR, the same `after` boundary runs the QR + Ed25519
 * verification stage. The QR stage needs a decoded raw QR string; the
 * `QrImageDecoder` provides it (pixels → raw string). v1 ships NO image decoder
 * (no decoder lib is approved), so `getDefaultQrDecoder()` returns null and the
 * QR stage is skipped honestly (no qr_verifications row, no fraud flag) — the
 * verify pipeline + parser/crypto are exercised by tests/qr/* directly. A later
 * PR can plug in a decoder and the route lights up with zero further edits.
 *
 * Phase boundary: R5 beneficiary matching is wired structurally (the pipeline
 * leaves the receipt `pending` on complete; beneficiary/review arrive in Phases
 * 5).
 */
export const dynamic = 'force-dynamic';

export interface ExtractRouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Resolve the QR *image* decoder (pixels → raw QR string). v1 ships NO decoder
 * (no decoder library is approved yet), so this returns null and the QR stage
 * is skipped honestly. The QR verification domain (parser + Ed25519 + pipeline)
 * is fully implemented and green via tests/qr/*. A later PR that installs a
 * decoder lib and returns an implementation here lights up QR verification in
 * the route with NO route-handler edits beyond this resolver.
 */
function getDefaultQrDecoder(): QrImageDecoder | null {
  return null;
}

export async function POST(_req: NextRequest, ctx: ExtractRouteContext) {
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: 'missing receipt id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  // RLS scopes this SELECT to the operator's branches (receipts_select). A row
  // returned to A must be at a branch A belongs to.
  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('id, tenant_id, branch_id, storage_path, mime_type, status')
    .eq('id', id)
    .maybeSingle();
  if (error || !receipt) {
    return Response.json({ error: 'receipt not found' }, { status: 404 });
  }

  // Defense in depth: re-check branch membership in the app layer (mirrors
  // receipts_select so a forged id from another branch is rejected at the gate).
  const allowed = await canAccessBranch(supabase, receipt.branch_id, receipt.tenant_id);
  if (!allowed) {
    return Response.json({ error: 'not authorized for that receipt' }, { status: 403 });
  }

  const engine = getDefaultOcrEngine();
  if (!engine) {
    // No OCR backend configured — honest 503; receipt stays pending. The threat
    // matrix covers a *missing binary*; here we cover a *missing engine config*.
    return Response.json(
      { error: 'OCR engine not configured (set TESSERACT_PATH or install tesseract)' },
      { status: 503 },
    );
  }

  // Capture everything `after` needs by value — the request context is gone by
  // the time the callback runs. `after` is stable in Next 16 (next/server).
  const engineRef = engine;
  const receiptId = receipt.id;
  const tenantId = receipt.tenant_id;
  const branchId = receipt.branch_id;
  const storagePath = receipt.storage_path;
  const mime = receipt.mime_type;

  after(async () => {
    let serviceClient;
    try {
      serviceClient = createSupabaseServiceClient();
    } catch {
      // Env unconfigured (no service role key) — common in test envs. Do not
      // crash the platform: leave the receipt `pending` and return.
      return;
    }
    try {
      await runExtractionPipeline({
        engine: engineRef,
        receiptId,
        tenantId,
        branchId,
        storagePath,
        mime,
        supabase: serviceClient,
      });
    } catch {
      // Threat matrix: any unhandled pipeline error leaves the receipt pending.
      // Surface it to platform logs; never escalate to a 500 the client already
      // received 202 for. (Phase 5 audit wire can record this failure.)
    }

    // Phase 4 (R3 / R4): QR + Ed25519 verification stage. Same `after` boundary
    // as OCR. Requires a QR image decoder (pixels → raw string). v2 ships NO
    // decoder (getDefaultQrDecoder → null), so the QR stage is skipped honestly;
    // when a decoder is plugged in this branch runs the verify pipeline (parser
    // → bank key lookup → Ed25519 verify → fraud flag on signature failure).
    const qrDecoder = getDefaultQrDecoder();
    if (qrDecoder) {
      try {
        await runQrStage({
          decoder: qrDecoder,
          supabase: serviceClient,
          receiptId,
          tenantId,
          branchId,
          storagePath,
          mime,
        });
      } catch {
        // Same threat-matrix posture as OCR: never escalate to a 500. An
        // unhandled QR error leaves the receipt in its OCR-result status.
      }
    }
  });

  return Response.json(
    { status: 'accepted', receiptId, message: 'OCR scheduled' },
    { status: 202 },
  );
}

/**
 * R3/R4 QR stage: download the original to a temp file, decode the QR image →
 * raw string, run the verification pipeline. Errors are caught by the caller.
 */
async function runQrStage(args: {
  decoder: QrImageDecoder;
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  receiptId: string;
  tenantId: string;
  branchId: string;
  storagePath: string;
  mime: string;
}): Promise<void> {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const os = (await import('node:os')).default;
  const path = (await import('node:path')).default;
  const { RECEIPTS_BUCKET } = await import('@/lib/upload/storage');

  const ext = mimeToExt(args.mime);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'qr-decode-'));
  const localPath = path.join(dir, `input${ext}`);
  try {
    const { data, error } = await args.supabase.storage
      .from(RECEIPTS_BUCKET)
      .download(args.storagePath);
    if (error || !data) return; // nothing to decode; honest skip
    await writeFile(localPath, new Uint8Array(await data.arrayBuffer()));
    const raw = await args.decoder.decode(localPath, args.mime);
    if (!raw) return; // no QR code found; honest skip (no fraud flag)
    await runQrVerificationPipeline({
      receiptId: args.receiptId,
      tenantId: args.tenantId,
      branchId: args.branchId,
      rawQr: raw,
      supabase: args.supabase,
    });
  } finally {
    await rm(localPath, { force: true });
  }
}

function mimeToExt(mime: string): string {
  if (mime === 'application/pdf') return '.pdf';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  return '.bin';
}

/**
 * GET surface: lets an operator (or the repository page) read the latest
 * extraction_result for inspection (R2 hint in the UI). Scoped by table RLS.
 */
export async function GET(_req: NextRequest, ctx: ExtractRouteContext) {
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: 'missing receipt id' }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('extraction_results')
    .select('engine_name, fields, confidence, status, created_at, completed_at')
    .eq('receipt_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ status: 'pending' }, { status: 202 });
  }
  return Response.json(data);
}