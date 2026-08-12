import { createClient } from '@supabase/supabase-js';

/**
 * RLS integration test fixtures.
 *
 * These tests run against a real Supabase instance (local dev via
 * `supabase start`, or CI). They seed two tenants, two branches, two users,
 * and the memberships that grant each user access to exactly one tenant —
 * then exercise Postgres RLS through anon-key clients signed in as each user.
 *
 * When the Supabase env is absent (no local stack running in this environment)
 * the suite skips cleanly instead of faking results.
 */

export const isRlsEnvConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export type FixtureIds = {
  tenantA: string;
  tenantB: string;
  branchA: string;
  branchB: string;
  userA: { email: string; password: string; id: string };
  userB: { email: string; password: string; id: string };
};

const rand = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Seeds two tenants (A, B), one branch per tenant, and two users —
 * userA is an operator in tenantA/branchA, userB in tenantB/branchB.
 * Neither user has any membership in the other tenant (R16 baseline).
 */
export async function seedFixtures(): Promise<FixtureIds> {
  const admin = serviceClient();

  const [{ data: tenantA }, { data: tenantB }] = await Promise.all([
    admin.from('tenants').insert({ name: 'Tenant A', slug: rand('tenant-a') }).select('id').single(),
    admin.from('tenants').insert({ name: 'Tenant B', slug: rand('tenant-b') }).select('id').single(),
  ]);
  if (!tenantA || !tenantB) throw new Error('seed: tenants insert failed');

  const [{ data: branchA }, { data: branchB }] = await Promise.all([
    admin
      .from('branches')
      .insert({ tenant_id: tenantA.id, name: 'Branch A1', code: 'A1' })
      .select('id').single(),
    admin
      .from('branches')
      .insert({ tenant_id: tenantB.id, name: 'Branch B1', code: 'B1' })
      .select('id').single(),
  ]);
  if (!branchA || !branchB) throw new Error('seed: branches insert failed');

  const emailA = `op-a-${Date.now()}@example.test`;
  const emailB = `op-b-${Date.now()}@example.test`;
  const password = 'TestPassw0rd!';

  const [{ data: authA, error: errA }, { data: authB, error: errB }] = await Promise.all([
    admin.auth.admin.createUser({ email: emailA, password }),
    admin.auth.admin.createUser({ email: emailB, password }),
  ]);
  if (errA || !authA?.user) throw new Error(`seed: createUser A failed: ${errA?.message}`);
  if (errB || !authB?.user) throw new Error(`seed: createUser B failed: ${errB?.message}`);

  await Promise.all([
    admin.from('profiles').insert({ id: authA.user.id, email: emailA }),
    admin.from('profiles').insert({ id: authB.user.id, email: emailB }),
    admin.from('tenant_memberships').insert({
      user_id: authA.user.id,
      tenant_id: tenantA.id,
      role: 'operator',
    }),
    admin.from('tenant_memberships').insert({
      user_id: authB.user.id,
      tenant_id: tenantB.id,
      role: 'operator',
    }),
    admin.from('branch_memberships').insert({
      user_id: authA.user.id,
      tenant_id: tenantA.id,
      branch_id: branchA.id,
    }),
    admin.from('branch_memberships').insert({
      user_id: authB.user.id,
      tenant_id: tenantB.id,
      branch_id: branchB.id,
    }),
  ]);

  return {
    tenantA: tenantA.id,
    tenantB: tenantB.id,
    branchA: branchA.id,
    branchB: branchB.id,
    userA: { email: emailA, password, id: authA.user.id },
    userB: { email: emailB, password, id: authB.user.id },
  };
}

/** Tries to sign in with the anon key as the given user. Throws on failure. */
export async function signInAs(email: string, password: string) {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn failed for ${email}: ${error?.message}`);
  // Return a freshly bound anon client carrying this user's session cookies.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    },
  );
}

/** Best-effort cleanup of seeded rows. Failures here are non-fatal. */
export async function teardown(fix: FixtureIds) {
  const admin = serviceClient();
  await Promise.all([
    admin.from('tenants').delete().eq('id', fix.tenantA),
    admin.from('tenants').delete().eq('id', fix.tenantB),
    admin.auth.admin.deleteUser(fix.userA.id),
    admin.auth.admin.deleteUser(fix.userB.id),
  ]).catch(() => {});
}