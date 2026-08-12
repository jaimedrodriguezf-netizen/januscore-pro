import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import {
  isRlsEnvConfigured,
  seedFixtures,
  signInAs,
  teardown,
  type FixtureIds,
} from './setup';

/**
 * R16 RED — RLS cross-tenant isolation.
 *
 * A user in tenant A MUST NOT see any data from tenant B: branches, tenants,
 * memberships. This is the regression anchor for R16; it must return 0 rows
 * for the foreign tenant and only the user's own rows for their tenant.
 *
 * Standard mode (no strict TDD). This is an integration test that requires a
 * real Supabase instance (local dev / CI). In environments without the Supabase
 * stack it skips cleanly — no fabricated results.
 */
describe.skipIf(!isRlsEnvConfigured)('R16 tenant isolation (RLS)', () => {
  let fix: FixtureIds;

  beforeAll(async () => {
    fix = await seedFixtures();
  });

  afterAll(async () => {
    if (fix) await teardown(fix);
  });

  it('user A sees tenant A and not tenant B', async () => {
    const client = await signInAs(fix.userA.email, fix.userA.password);
    const { data, error } = await client.from('tenants').select('id');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(fix.tenantA);
  });

  it('user A sees only branch A1, never branch B1 (cross-tenant = 0 rows)', async () => {
    const client = await signInAs(fix.userA.email, fix.userA.password);
    const { data, error } = await client.from('branches').select('id, tenant_id');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(fix.branchA);
    expect(data![0].tenant_id).toBe(fix.tenantA);

    // Explicit cross-tenant probe: filtering for tenant B yields nothing.
    const cross = await client
      .from('branches')
      .select('id')
      .eq('tenant_id', fix.tenantB);
    expect(cross.error).toBeNull();
    expect(cross.data).toEqual([]); // R16: 0 rows from the foreign tenant
  });

  it('user A sees only their own memberships (no foreign tenant_memberships)', async () => {
    const client = await signInAs(fix.userA.email, fix.userA.password);
    const { data, error } = await client.from('tenant_memberships').select('tenant_id');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].tenant_id).toBe(fix.tenantA);
  });

  it('user B is the mirror of user A (sees tenant B only)', async () => {
    const client = await signInAs(fix.userB.email, fix.userB.password);
    const { data, error } = await client.from('tenants').select('id');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(fix.tenantB);
  });
});