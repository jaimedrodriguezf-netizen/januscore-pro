import { describe, expect, it, beforeAll, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { sign, getPublicKey } from '@noble/ed25519';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureNobleSha512 } from '@/lib/crypto/ed25519';
import { runQrVerificationPipeline } from '@/lib/qr/pipeline';
import {
  listBankPublicKeys,
  getActiveBankPublicKey,
  addBankPublicKey,
  deactivateBankPublicKey,
  toggleBankPublicKeyStatus,
  BankPublicKey,
} from '@/lib/admin/keys';

describe('Admin Bank Public Keys Lifecycle (R14)', () => {
  let priv: Uint8Array;
  let pub: Uint8Array;
  let pubHex: string;

  beforeAll(() => {
    ensureNobleSha512();
    priv = randomBytes(32);
    pub = getPublicKey(priv);
    pubHex = Buffer.from(pub).toString('hex');
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

  function createMockSupabase(initialKeys: BankPublicKey[] = []) {
    const keys = [...initialKeys];
    const inserts: Array<Record<string, unknown>> = [];
    const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];

    const client = {
      from: vi.fn((table: string) => {
        if (table === 'bank_public_keys') {
          return {
            select: vi.fn((_cols?: string) => ({
              eq: vi.fn((col1: string, val1: unknown) => ({
                order: vi.fn((_ordCol: string, _ordOpts: unknown) => {
                  const filtered = keys.filter((k) => (k as any)[col1] === val1);
                  return Promise.resolve({ data: filtered, error: null });
                }),
                eq: vi.fn((col2: string, val2: unknown) => ({
                  eq: vi.fn((col3: string, val3: unknown) => ({
                    maybeSingle: vi.fn(() => {
                      const match = keys.find(
                        (k) =>
                          (k as any)[col1] === val1 &&
                          (k as any)[col2] === val2 &&
                          (k as any)[col3] === val3,
                      );
                      return Promise.resolve({ data: match ?? null, error: null });
                    }),
                  })),
                  maybeSingle: vi.fn(() => {
                    const match = keys.find(
                      (k) => (k as any)[col1] === val1 && (k as any)[col2] === val2,
                    );
                    return Promise.resolve({ data: match ?? null, error: null });
                  }),
                })),
              })),
            })),
            insert: vi.fn((payload: Record<string, unknown>) => {
              const newKey: BankPublicKey = {
                id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                tenant_id: payload.tenant_id as string,
                bank: payload.bank as string,
                public_key: payload.public_key as string,
                is_active: payload.is_active as boolean ?? true,
                created_by: (payload.created_by as string) ?? null,
                created_at: new Date().toISOString(),
                deactivated_at: null,
              };
              keys.push(newKey);
              inserts.push(payload);
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: newKey, error: null }),
              };
            }),
            update: vi.fn((patch: Record<string, unknown>) => ({
              eq: vi.fn((col: string, val: unknown) => {
                const target = keys.find((k) => (k as any)[col] === val);
                if (target) {
                  Object.assign(target, patch);
                  updates.push({ id: String(val), patch });
                }
                return {
                  select: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({ data: target ?? null, error: null }),
                  eq: vi.fn((col2: string, val2: unknown) => {
                    const scoped = keys.find(
                      (k) => (k as any)[col] === val && (k as any)[col2] === val2,
                    );
                    if (scoped) Object.assign(scoped, patch);
                    return {
                      select: vi.fn().mockReturnThis(),
                      single: vi.fn().mockResolvedValue({ data: scoped ?? null, error: null }),
                    };
                  }),
                };
              }),
            })),
          };
        }

        if (table === 'qr_verifications') {
          return {
            insert: vi.fn((payload: Record<string, unknown>) => {
              return Promise.resolve({ error: null });
            }),
          };
        }

        if (table === 'receipts') {
          return {
            update: vi.fn((_patch: Record<string, unknown>) => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    return { client, keys };
  }

  it('validates 32-byte hex public keys upon addition (R14)', async () => {
    const { client } = createMockSupabase();

    // Invalid non-hex string
    await expect(
      addBankPublicKey(client, {
        tenantId: 'tenant-1',
        bank: 'Pichincha',
        publicKeyHex: 'not-a-valid-hex-string',
      }),
    ).rejects.toThrow(/valid 32-byte.*hex string/);

    // Hex string of wrong length (e.g. 16 bytes = 32 hex chars)
    await expect(
      addBankPublicKey(client, {
        tenantId: 'tenant-1',
        bank: 'Pichincha',
        publicKeyHex: '0123456789abcdef0123456789abcdef',
      }),
    ).rejects.toThrow(/valid 32-byte.*hex string/);

    // Valid 64-character hex succeeds
    const created = await addBankPublicKey(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      publicKeyHex: pubHex,
    });

    expect(created.id).toBeDefined();
    expect(created.is_active).toBe(true);
    expect(created.public_key).toBe(pubHex.toLowerCase());
  });

  it('lists configured keys and fetches active bank public key', async () => {
    const { client } = createMockSupabase();
    await addBankPublicKey(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      publicKeyHex: pubHex,
    });

    const keyList = await listBankPublicKeys(client, 'tenant-1');
    expect(keyList).toHaveLength(1);
    expect(keyList[0].bank).toBe('Pichincha');

    const activeKey = await getActiveBankPublicKey(client, 'tenant-1', 'Pichincha');
    expect(activeKey).not.toBeNull();
    expect(activeKey?.public_key).toBe(pubHex.toLowerCase());
  });

  it('R14: key deactivation causes QR verification pipeline to fall back to incomplete', async () => {
    const { client } = createMockSupabase();
    const key = await addBankPublicKey(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      publicKeyHex: pubHex,
    });

    const qrRaw = buildSignedPichinchaQr();

    // 1. When active, pipeline verifies signature
    const verifiedOutcome = await runQrVerificationPipeline({
      receiptId: 'r1',
      tenantId: 'tenant-1',
      branchId: 'b1',
      rawQr: qrRaw,
      supabase: client,
    });
    expect(verifiedOutcome.status).toBe('verified');

    // 2. Deactivate the key (R14)
    const deactivated = await deactivateBankPublicKey(client, key.id, 'tenant-1');
    expect(deactivated.is_active).toBe(false);
    expect(deactivated.deactivated_at).not.toBeNull();

    // 3. Active key lookup now yields null
    const activeLookup = await getActiveBankPublicKey(client, 'tenant-1', 'Pichincha');
    expect(activeLookup).toBeNull();

    // 4. Same QR string verification pipeline now results in 'incomplete' (no active key)
    const incompleteOutcome = await runQrVerificationPipeline({
      receiptId: 'r2',
      tenantId: 'tenant-1',
      branchId: 'b1',
      rawQr: qrRaw,
      supabase: client,
    });
    expect(incompleteOutcome.status).toBe('incomplete');
  });

  it('toggleBankPublicKeyStatus reactivates and deactivates correctly', async () => {
    const { client } = createMockSupabase();
    const key = await addBankPublicKey(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      publicKeyHex: pubHex,
    });

    // Deactivate
    const off = await toggleBankPublicKeyStatus(client, key.id, false, 'tenant-1');
    expect(off.is_active).toBe(false);

    // Reactivate
    const on = await toggleBankPublicKeyStatus(client, key.id, true, 'tenant-1');
    expect(on.is_active).toBe(true);
    expect(on.deactivated_at).toBeNull();
  });
});
