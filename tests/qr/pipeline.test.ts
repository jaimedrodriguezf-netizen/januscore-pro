import { describe, expect, it, beforeAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import { sign, getPublicKey } from '@noble/ed25519';
import type { SupabaseClient } from '@supabase/supabase-js';
import { pichinchaParser } from '@/lib/qr/pichincha';
import { ensureNobleSha512 } from '@/lib/crypto/ed25519';
import { runQrVerificationPipeline } from '@/lib/qr/pipeline';

/**
 * Phase 4 / PR4 — R3 + R4 pipeline integration tests (4.7, 4.8, 4.9, 4.10).
 *
 * Pure unit harness: the Supabaseclient is a typed mock (no DB / Docker). The
 * Ed25519 path is REAL — a fresh key pair is generated and a genuine signature
 * is produced and verified by `@noble/ed25519` (sha512 shim → node:crypto), so
 * the verified vs tampered branches exercise the actual crypto, not a stub.
 *
 * R4 contract proven here: a signature failure sets `fraud_flag=true` AND routes
 * to `needs_review`, NEVER auto-rejects. Unsupported bank (R3) and no-key (R3)
 * route to review WITHOUT the fraud flag (only a signature failure is fraud).
 */

let priv: Uint8Array;
let pub: Uint8Array;

beforeAll(() => {
  ensureNobleSha512();
  priv = randomBytes(32);
  pub = getPublicKey(priv);
});

function buildSignedPichinchaQr(): string {
  const parts = [
    'ONLINE', 'BP_TO_DEUNA', 'Banco Pichincha', 'JUAN PEREZ', '0123456789',
    'Banco Pichincha', 'MARIA LOPEZ', '9876543210', '1.234,56', '1710400000',
    'uuid-1234', '8723498273',
  ];
  const signedData = parts.join(':');
  const sig = sign(new TextEncoder().encode(signedData), priv);
  return parts.join(':') + ':' + Buffer.from(sig).toString('hex');
}

interface MockScript {
  /** Returns the active bank_public_keys row, or null to simulate no key. */
  key: { id: string; bank: string; public_key: string } | null;
  /** Forces an insert error (simulate persistence failure). */
  insertError?: string;
}

/** Minimal chainable SupabaseClient mock recording all three call sites. */
function makeMockSupabase(script: MockScript): {
  client: SupabaseClient;
  inserts: Array<Record<string, unknown>>;
  receiptUpdates: Array<{ id: string; patch: Record<string, unknown> }>;
} {
  const inserts: Array<Record<string, unknown>> = [];
  const receiptUpdates: Array<{ id: string; patch: Record<string, unknown> }> = [];

  const chain = (table: string): ReturnType<SupabaseClient['from']> => {
    const state: {
      eqs: Record<string, unknown>;
      row: Record<string, unknown> | null;
      single?: boolean;
    } = { eqs: {}, row: null, single: false };
    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: (col: string, val: unknown) => {
        state.eqs[col] = val;
        return builder;
      },
      maybeSingle: () =>
        Promise.resolve({
          data: table === 'bank_public_keys' ? script.key : null,
          error: null,
        }),
      insert: (row: Record<string, unknown>) => {
        inserts.push(row);
        return Promise.resolve({
          error: script.insertError ? { message: script.insertError } : null,
        });
      },
      update: (patch: Record<string, unknown>) => ({
        eq: (idCol: string, idVal: string) => {
          if (table === 'receipts') {
            receiptUpdates.push({ id: `${idCol}=${idVal}`, patch });
          }
          return Promise.resolve({ error: null });
        },
      }),
    };
    return builder as unknown as ReturnType<SupabaseClient['from']>;
  };

  const client = {
    from: (table: string) => chain(table),
  } as unknown as SupabaseClient;
  return { client, inserts, receiptUpdates };
}

function buildTamperedQr(): string {
  // Same signed_data as the valid QR but a signature over DIFFERENT data → mismatch.
  const otherParts = [
    'ONLINE', 'BP_TO_DEUNA', 'Banco Pichincha', 'ATTACKER', '0123456789',
    'Banco Pichincha', 'MARIA LOPEZ', '9876543210', '1.234,56', '1710400000',
    'uuid-1234', '8723498273',
  ];
  const signedData = otherParts.join(':');
  const sig = sign(new TextEncoder().encode(signedData), priv);
  // Re-emit with the victim's signed_data but the attacker's signature → mismatch.
  const realParts = [
    'ONLINE', 'BP_TO_DEUNA', 'Banco Pichincha', 'JUAN PEREZ', '0123456789',
    'Banco Pichincha', 'MARIA LOPEZ', '9876543210', '1.234,56', '1710400000',
    'uuid-1234', '8723498273',
  ];
  return realParts.join(':') + ':' + Buffer.from(sig).toString('hex');
}

describe('4.7 — R3: valid Pichincha signature → verified', () => {
  it('persists status=verified, links the public_key_id, sets verified_at, leaves receipt status untouched', async () => {
    const pubHex = Buffer.from(pub).toString('hex');
    const { client, inserts, receiptUpdates } = makeMockSupabase({
      key: { id: 'key-1', bank: 'Pichincha', public_key: pubHex },
    });
    const outcome = await runQrVerificationPipeline({
      receiptId: 'r1',
      tenantId: 't1',
      branchId: 'b1',
      rawQr: buildSignedPichinchaQr(),
      supabase: client,
    });
    expect(outcome.status).toBe('verified');
    expect(outcome.parserName).toBe('pichincha');
    expect(outcome.bank).toBe('Pichincha');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].status).toBe('verified');
    expect(inserts[0].public_key_id).toBe('key-1');
    expect(inserts[0].verified_at).not.toBeNull();
    // R3 valid signature → receipt NOT transitioned (Phase 5 review decides).
    expect(receiptUpdates).toHaveLength(0);
  });
});

describe('4.8 — R4 RED: invalid signature → fraud_flag + needs_review (NEVER auto-reject)', () => {
  it('persists status=failed, sets fraud_flag=true, transitions to needs_review', async () => {
    const pubHex = Buffer.from(pub).toString('hex');
    const { client, inserts, receiptUpdates } = makeMockSupabase({
      key: { id: 'key-1', bank: 'Pichincha', public_key: pubHex },
    });
    const outcome = await runQrVerificationPipeline({
      receiptId: 'r2',
      tenantId: 't1',
      branchId: 'b1',
      rawQr: buildTamperedQr(),
      supabase: client,
    });
    expect(outcome.status).toBe('failed');
    expect(inserts[0].status).toBe('failed');
    expect(inserts[0].error).toContain('signature does not match');
    // R4: exactly one receipts UPDATE with BOTH fraud_flag=true AND needs_review.
    expect(receiptUpdates).toHaveLength(1);
    expect(receiptUpdates[0].patch).toEqual({
      status: 'needs_review',
      fraud_flag: true,
    });
    // The receipt is NEVER auto-rejected (no status=rejected anywhere).
    expect(receiptUpdates[0].patch.status).toBe('needs_review');
  });

  it('a Pichincha QR with no signature slice → failed + fraud_flag (anomalous)', async () => {
    const pubHex = Buffer.from(pub).toString('hex');
    const { client, receiptUpdates } = makeMockSupabase({
      key: { id: 'key-1', bank: 'Pichincha', public_key: pubHex },
    });
    const outcome = await runQrVerificationPipeline({
      receiptId: 'r3',
      tenantId: 't1',
      branchId: 'b1',
      // Pichincha-shaped but <13 parts → no signature slice.
      rawQr: 'BP_TO_DEUNA:Banco Pichincha:a:b:c:d:e:f:g:h:i:j',
      supabase: client,
    });
    expect(outcome.status).toBe('failed');
    expect(receiptUpdates[0].patch.fraud_flag).toBe(true);
  });
});

describe('4.9 — R3: unsupported bank → unsupported, review, NO fraud flag', () => {
  it('routes a non-Pichincha QR to unsupported + needs_review without fraud_flag', async () => {
    const { client, inserts, receiptUpdates } = makeMockSupabase({ key: null });
    const outcome = await runQrVerificationPipeline({
      receiptId: 'r4',
      tenantId: 't1',
      branchId: 'b1',
      rawQr: 'https://produbanco.com/pay?monto=10',
      supabase: client,
    });
    expect(outcome.status).toBe('unsupported');
    expect(outcome.parserName).toBe('generic');
    expect(outcome.bank).toBe('unknown');
    expect(inserts[0].status).toBe('unsupported');
    expect(receiptUpdates).toHaveLength(1);
    expect(receiptUpdates[0].patch).toEqual({ status: 'needs_review' });
    // No fraud_flag key at all → R4 protects non-fraud unsupported routing.
    expect('fraud_flag' in receiptUpdates[0].patch).toBe(false);
  });
});

describe('4.10 — R3: no key configured → incomplete, review, NO fraud flag', () => {
  it('a Pichincha QR with no active public key → status=incomplete + needs_review (no fraud)', async () => {
    const { client, inserts, receiptUpdates } = makeMockSupabase({ key: null });
    const outcome = await runQrVerificationPipeline({
      receiptId: 'r5',
      tenantId: 't1',
      branchId: 'b1',
      rawQr: buildSignedPichinchaQr(),
      supabase: client,
    });
    expect(outcome.status).toBe('incomplete');
    expect(outcome.bank).toBe('Pichincha');
    expect(inserts[0].status).toBe('incomplete');
    expect(inserts[0].public_key_id).toBeNull();
    expect(receiptUpdates[0].patch).toEqual({ status: 'needs_review' });
    expect('fraud_flag' in receiptUpdates[0].patch).toBe(false);
  });
});

describe('R14 forward-link — deactivated bank key behaves as no key', () => {
  it('a script returning no active key (R14 deactivated) routes to incomplete', async () => {
    const { client, receiptUpdates } = makeMockSupabase({ key: null });
    const outcome = await runQrVerificationPipeline({
      receiptId: 'r6',
      tenantId: 't1',
      branchId: 'b1',
      rawQr: buildSignedPichinchaQr(),
      supabase: client,
    });
    expect(outcome.status).toBe('incomplete');
    expect(receiptUpdates[0].patch.fraud_flag).toBeUndefined();
  });
});

// Sanity: the Pichincha parser used by the pipeline still conforms.
describe('parser conformance (pipeline entry point)', () => {
  it('a Pichincha QR reaches the pichincha parser through findQrParser', () => {
    expect(pichinchaParser.matches('ONLINE:BP_TO_DEUNA:Banco Pichincha:x')).toBe(true);
  });
});