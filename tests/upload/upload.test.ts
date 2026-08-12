import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import {
  isRlsEnvConfigured,
  seedFixtures,
  signInAs,
  teardown,
  type FixtureIds,
} from '../rls/setup';
import { buildStoragePath, RECEIPTS_BUCKET } from '@/lib/upload/storage';

/**
 * R1 — Manual ingestion (Phase 2 / PR2).
 *
 * Two layers of evidence:
 *   1. A pure unit test of `buildStoragePath` that runs in every environment
 *      and asserts the immutable path convention (R1 immutability anchor).
 *   2. Integration tests against a real Supabase instance that prove the
 *      authenticated upload + register flow creates a pending receipt at the
 *      operator's own branch (2.5) and rejects an upload to a branch the user
 *      is not a member of (2.6). These skip cleanly when the Supabase stack is
 *      absent — no fabricated results.
 */

describe('R1 storage path convention (pure unit)', () => {
  it('builds <tenant>/<branch>/<YYYY>/<MM>/<uuid> from a fixed date', () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const branchId = '22222222-2222-2222-2222-222222222222';
    const fileId = '33333333-3333-3333-3333-333333333333';
    const fixed = new Date(Date.UTC(2026, 2, 14)); // 2026-03

    const path = buildStoragePath(tenantId, branchId, fileId, fixed);
    expect(path).toBe(
      `${tenantId}/${branchId}/2026/03/${fileId}`,
    );
  });

  it('keys every object by a unique uuid so re-uploads never overwrite (R1 immutability)', () => {
    const path = (id: string) =>
      buildStoragePath('t', 'b', id, new Date(Date.UTC(2026, 0, 1)));
    expect(path('a')).not.toBe(path('b'));
    expect(path('a').split('/').pop()).toBe('a');
  });

  it('targets the private receipts-original bucket', () => {
    expect(RECEIPTS_BUCKET).toBe('receipts-original');
  });
});

describe.skipIf(!isRlsEnvConfigured)('R1 upload + register (integration)', () => {
  let fix: FixtureIds;

  beforeAll(async () => {
    fix = await seedFixtures();
  });

  afterAll(async () => {
    if (fix) await teardown(fix);
  });

  it('2.5 — operator A uploads to their own branch A and a pending receipt is registered', async () => {
    const client = await signInAs(fix.userA.email, fix.userA.password);
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG-ish magic
    const fileId = crypto.randomUUID();
    const path = buildStoragePath(fix.tenantA, fix.branchA, fileId);

    const up = await client.storage
      .from(RECEIPTS_BUCKET)
      .upload(path, bytes, { contentType: 'image/png', upsert: false });
    expect(up.error).toBeNull();

    // Register through the same authenticated client → receipts RLS INSERT.
    const ins = await client.from('receipts').insert({
      tenant_id: fix.tenantA,
      branch_id: fix.branchA,
      uploaded_by: fix.userA.id,
      status: 'pending',
      storage_path: path,
      original_filename: 'receipt.png',
      mime_type: 'image/png',
      file_size: bytes.byteLength,
      file_sha256: '0000000000000000000000000000000000000000000000000000000000000000',
    }).select('id, status, branch_id').single();
    expect(ins.error).toBeNull();
    expect(ins.data!.status).toBe('pending');
    expect(ins.data!.branch_id).toBe(fix.branchA); // registered at the correct branch
  });

  it('2.6 — operator A is rejected when targeting branch B (no membership)', async () => {
    const client = await signInAs(fix.userA.email, fix.userA.password);
    const fileId = crypto.randomUUID();
    const foreignPath = buildStoragePath(fix.tenantB, fix.branchB, fileId);

    // Storage INSERT RLS: A has no membership in branch B → blocked.
    const up = await client.storage
      .from(RECEIPTS_BUCKET)
      .upload(foreignPath, new Uint8Array([1, 2, 3]), {
        contentType: 'image/png',
        upsert: false,
      });
    expect(up.error).not.toBeNull(); // authorization error surfaced by Storage RLS

    // Table RLS: a direct receipts insert at branch B is also blocked.
    const ins = await client.from('receipts').insert({
      tenant_id: fix.tenantB,
      branch_id: fix.branchB,
      uploaded_by: fix.userA.id,
      status: 'pending',
      storage_path: foreignPath,
      original_filename: 'x.png',
      mime_type: 'image/png',
      file_size: 3,
      file_sha256: '0'.repeat(64),
    });
    expect(ins.error).not.toBeNull(); // R16 + R1 authorization gate
    expect(ins.count).toBeNull();
  });
});