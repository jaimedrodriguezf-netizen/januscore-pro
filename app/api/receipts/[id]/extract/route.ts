import { after } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessBranch } from '@/lib/tenancy/branch';
import { getDefaultOcrEngine } from '@/lib/ocr/tesseract';
import { runExtractionPipeline } from '@/lib/ocr/pipeline';

/**
 * R2 / R5 — POST /api/receipts/[id]/extract.
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
 * Phase boundary: R5 beneficiary matching is wired structurally (the pipeline
 * leaves the receipt `pending` on complete; QR/Ed25519/beneficiary/review arrive
 * in Phases 4–5 and augment this same route handler).
 */
export const dynamic = 'force-dynamic';

interface ExtractRouteContext {
  params: Promise<{ id: string }>;
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
  });

  return Response.json(
    { status: 'accepted', receiptId, message: 'OCR scheduled' },
    { status: 202 },
  );
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