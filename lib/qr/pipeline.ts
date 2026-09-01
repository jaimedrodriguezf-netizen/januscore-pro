import type { SupabaseClient } from '@supabase/supabase-js';
import { findQrParser, PICHINCHA_BANK } from './parser';
import { verifyEd25519 } from '@/lib/crypto/ed25519';

/**
 * R3 / R4 — QR verification pipeline (lib/qr/pipeline.ts).
 *
 * Takes the already-decoded raw QR string and runs the full R3/R4 flow:
 *   1. resolve a parser via `findQrParser` (Pichincha → generic fallback).
 *   2. unsupported bank (parser.bank === 'unknown') → persist a
 *      `qr_verifications.status='unsupported'` row, route the receipt to
 *      review (needs_review), NO fraud flag (R3 — only a signature failure
 *      is fraud per R4).
 *   3. supported bank but no active `bank_public_keys` row for this tenant →
 *      persist `status='incomplete'`, route to review, NO fraud flag (R3
 *      "no key configured → review").
 *   4. supported bank, key present, signature present → Ed25519 verify.
 *      * valid → `status='verified'`, link the public_key_id, verified_at now;
 *        the receipt stays in its current status (Phase 5 review decides).
 *      * invalid OR signature/signedData missing → `status='failed'`,
 *        fraud_flag=true on the receipt, needs_review (R4 — NEVER auto-reject).
 *
 * The pipeline uses the SERVICE client (bypasses RLS) for bank_public_keys
 * SELECT, qr_verifications INSERT, and the receipts.fraud_flag / status UPDATE.
 * It is a total function: every branch persists exactly one qr_verifications
 * row and leaves the receipt in a defined state, so the route can call it
 * unconditionally once a raw QR string is available.
 *
 * The QR *image* decode (pixels → raw string) is injected by the route through
 * `QrImageDecoder`; no decoder lib is approved for v1, so when the route has no
 * decoder it simply does not call this pipeline (nothing to verify — honest
 * skip, like the OCR engine returning null).
 */

export type QrVerificationStatus = 'verified' | 'failed' | 'unsupported' | 'incomplete';

export interface BankPublicKeyRow {
  id: string;
  bank: string;
  public_key: string;
}

export interface QrImageDecoder {
  /** Decode a QR code from a local image file → raw string, or null if none found. */
  decode(localPath: string, mime: string): Promise<string | null>;
}

export interface RunQrVerificationArgs {
  receiptId: string;
  tenantId: string;
  branchId: string;
  rawQr: string;
  /** Service-role client (bypasses RLS). Tests pass a mock. */
  supabase: SupabaseClient;
}

export interface QrVerificationOutcome {
  status: QrVerificationStatus;
  parserName: string;
  bank: string;
}

export async function runQrVerificationPipeline(
  args: RunQrVerificationArgs,
): Promise<QrVerificationOutcome> {
  const resolved = findQrParser(args.rawQr);
  if (!resolved) {
    // Defensive: the generic fallback matches everything, so this is unreachable
    // in v1. Treat as unsupported if a future registry edit drops the fallback.
    return persistQrRow(args, {
      status: 'unsupported',
      parserName: 'none',
      bank: 'unknown',
      fields: {},
      signedData: null,
      signature: null,
      publicKeyId: null,
      error: 'no parser claimed this QR',
      setFraudFlag: false,
    });
  }

  const { parser, result } = resolved;

  // R3 "unsupported bank": generic parser tagged unknown (non-Pichincha QR).
  if (parser.bank === 'unknown') {
    return persistQrRow(args, {
      status: 'unsupported',
      parserName: parser.name,
      bank: 'unknown',
      fields: result.fields,
      signedData: result.signedData ?? null,
      signature: result.signature ?? null,
      publicKeyId: null,
      error: 'unsupported bank (v1: Pichincha only)',
      setFraudFlag: false,
    });
  }

  // R3 "supported bank": look up an ACTIVE public key for this tenant + bank.
  const bank = bankLabelFor(parser.bank);
  const key = await fetchActivePublicKey(args.supabase, args.tenantId, bank);
  if (!key) {
    return persistQrRow(args, {
      status: 'incomplete',
      parserName: parser.name,
      bank,
      fields: result.fields,
      signedData: result.signedData ?? null,
      signature: result.signature ?? null,
      publicKeyId: null,
      error: 'no active bank public key configured',
      setFraudFlag: false,
    });
  }

  // Need both signedData and signature to attempt verification.
  if (!result.signedData || !result.signature) {
    return persistQrRow(args, {
      status: 'failed',
      parserName: parser.name,
      bank,
      fields: result.fields,
      signedData: result.signedData ?? null,
      signature: result.signature ?? null,
      publicKeyId: key.id,
      error: 'missing signed_data or signature',
      setFraudFlag: true,
    });
  }

  const verify = await verifyEd25519({
    publicKeyHex: key.public_key,
    signatureHex: result.signature,
    signedData: result.signedData,
  });

  if (verify.ok) {
    return persistQrRow(args, {
      status: 'verified',
      parserName: parser.name,
      bank,
      fields: result.fields,
      signedData: result.signedData,
      signature: result.signature,
      publicKeyId: key.id,
      error: null,
      setFraudFlag: false,
    });
  }

  // R4: signature failure (well-formed but non-matching, or malformed) → fraud.
  return persistQrRow(args, {
    status: 'failed',
    parserName: parser.name,
    bank,
    fields: result.fields,
    signedData: result.signedData,
    signature: result.signature,
    publicKeyId: key.id,
    error: verify.malformed ? 'malformed signature or key' : 'signature does not match',
    setFraudFlag: true,
  });
}

function bankLabelFor(parserBank: string): string {
  return parserBank === 'pichincha' ? PICHINCHA_BANK : parserBank;
}

async function fetchActivePublicKey(
  supabase: SupabaseClient,
  tenantId: string,
  bank: string,
): Promise<BankPublicKeyRow | null> {
  const { data, error } = await supabase
    .from('bank_public_keys')
    .select('id, bank, public_key')
    .eq('tenant_id', tenantId)
    .eq('bank', bank)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as BankPublicKeyRow;
}

interface PersistInputs {
  status: QrVerificationStatus;
  parserName: string;
  bank: string;
  fields: Record<string, string | null>;
  signedData: string | null;
  signature: string | null;
  publicKeyId: string | null;
  error: string | null;
  setFraudFlag: boolean;
}

async function persistQrRow(
  args: RunQrVerificationArgs,
  inputs: PersistInputs,
): Promise<QrVerificationOutcome> {
  const now = new Date().toISOString();
  const { error: insErr } = await args.supabase.from('qr_verifications').insert({
    receipt_id: args.receiptId,
    tenant_id: args.tenantId,
    branch_id: args.branchId,
    parser_name: inputs.parserName,
    bank: inputs.bank,
    fields: inputs.fields,
    signed_data: inputs.signedData,
    signature: inputs.signature,
    status: inputs.status,
    public_key_id: inputs.publicKeyId,
    error: inputs.error,
    verified_at: inputs.status === 'verified' ? now : null,
  });
  if (insErr) {
    // Persistence failure must NOT silently leave a verified sig unrecorded NOR
    // swallow a fraud flag. Re-throw so the route's after-handler logs it; the
    // receipt stays in its prior status (service client UPDATE below is skipped).
    throw new Error(`qr_verifications insert failed: ${insErr.message}`);
  }

  // R4 / R3 status routing. Verified → no change (Phase 5 review decides). Every
  // non-verified terminal → needs_review. Only signature failures set fraud_flag.
  if (inputs.status !== 'verified') {
    const patch: Record<string, unknown> = { status: 'needs_review' };
    if (inputs.setFraudFlag) patch.fraud_flag = true;
    await args.supabase.from('receipts').update(patch).eq('id', args.receiptId);
  }

  return { status: inputs.status, parserName: inputs.parserName, bank: inputs.bank };
}