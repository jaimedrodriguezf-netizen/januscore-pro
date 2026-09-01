import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { getMyRole } from '@/lib/tenancy/role';

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; ok?: string; err?: string }>;
}) {
  const queryParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-neutral-600">Please sign in to view users.</p>
      </main>
    );
  }

  const tenantIds = await getAccessibleTenantIds(supabase);
  const activeTenantId = queryParams.tenantId || tenantIds[0];

  if (!activeTenantId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-neutral-600">No active tenant found.</p>
      </main>
    );
  }

  const role = await getMyRole(supabase, activeTenantId);
  if (role !== 'tenant_admin' && role !== 'platform_admin') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Access Restricted (R13):</strong> Tenant Admin or Platform Superadmin privilege required.
        </div>
      </main>
    );
  }

  // Fetch branches
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, code')
    .eq('tenant_id', activeTenantId)
    .order('name');

  // Fetch tenant memberships with profile info
  const { data: memberships } = await supabase
    .from('tenant_memberships')
    .select('id, user_id, role, created_at, profiles(id, email, full_name)')
    .eq('tenant_id', activeTenantId);

  // Fetch branch memberships
  const { data: branchMemberships } = await supabase
    .from('branch_memberships')
    .select('id, user_id, branch_id, is_default, branches(name, code)')
    .eq('tenant_id', activeTenantId);

  async function updateRoleAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const membershipId = String(formData.get('membershipId') || '');
    const newRole = formData.get('role') as 'tenant_admin' | 'operator' | 'client';

    const { error } = await supabase
      .from('tenant_memberships')
      .update({ role: newRole })
      .eq('id', membershipId)
      .eq('tenant_id', activeTenantId);

    if (error) {
      redirect(`/settings/users?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/settings/users');
    redirect(`/settings/users?tenantId=${activeTenantId}&ok=User role updated`);
  }

  async function assignBranchAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const userId = String(formData.get('userId') || '');
    const branchId = String(formData.get('branchId') || '');

    if (!userId || !branchId) {
      redirect(`/settings/users?tenantId=${activeTenantId}&err=User and branch required`);
    }

    const { error } = await supabase.from('branch_memberships').insert({
      user_id: userId,
      tenant_id: activeTenantId,
      branch_id: branchId,
      role: 'operator',
      is_default: false,
    });

    if (error) {
      redirect(`/settings/users?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/settings/users');
    redirect(`/settings/users?tenantId=${activeTenantId}&ok=Branch assigned successfully`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/receipts" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span>Settings</span>
            <span>/</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Users & Roles (R13)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            User Roles & Permissions
          </h1>
          <p className="text-xs text-neutral-500">
            Manage tenant admins, operators, and branch assignments.
          </p>
        </div>
      </div>

      {queryParams.ok && (
        <div className="mb-6 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {queryParams.ok}
        </div>
      )}
      {queryParams.err && (
        <div className="mb-6 rounded-md bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {queryParams.err}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Tenant Members ({memberships?.length ?? 0})
          </h2>
        </div>
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-800/50">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role (R13)</th>
              <th className="px-4 py-3">Assigned Branches</th>
              <th className="px-4 py-3 text-right">Assign Branch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {!memberships || memberships.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-neutral-500">
                  No members found in this tenant.
                </td>
              </tr>
            ) : (
              memberships.map((m) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                const userBranches = (branchMemberships ?? []).filter((bm) => bm.user_id === m.user_id);
                return (
                  <tr key={m.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                      <div>{profile?.full_name || '—'}</div>
                      <div className="font-mono text-[11px] text-neutral-500">{profile?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <form action={updateRoleAction} className="inline-flex items-center gap-2">
                        <input type="hidden" name="membershipId" value={m.id} />
                        <select
                          name="role"
                          defaultValue={m.role}
                          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="client">Client</option>
                          <option value="operator">Operator</option>
                          <option value="tenant_admin">Tenant Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {userBranches.length === 0 ? (
                          <span className="text-[11px] text-neutral-400">All (Admin) / None</span>
                        ) : (
                          userBranches.map((ub) => {
                            const b = Array.isArray(ub.branches) ? ub.branches[0] : ub.branches;
                            return (
                              <span
                                key={ub.id}
                                className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {b?.name} ({b?.code})
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <form action={assignBranchAction} className="inline-flex items-center gap-1">
                        <input type="hidden" name="userId" value={m.user_id} />
                        <select
                          name="branchId"
                          className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          {branches?.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.code}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white shadow hover:bg-indigo-500"
                        >
                          + Add
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
