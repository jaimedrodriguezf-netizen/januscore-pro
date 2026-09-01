import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { getMyRole } from '@/lib/tenancy/role';

export default async function BranchesAdminPage({
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
        <p className="text-sm text-neutral-600">Please sign in to access branch settings.</p>
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
  const isAuthorized = role === 'tenant_admin' || role === 'platform_admin';

  if (!isAuthorized) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Access Restricted (R12):</strong> Tenant Admin or Platform Superadmin privilege required.
        </div>
      </main>
    );
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false });

  async function createBranchAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const name = String(formData.get('name') || '').trim();
    const code = String(formData.get('code') || '').trim().toUpperCase();

    if (!name || !code) {
      redirect(`/settings/branches?tenantId=${activeTenantId}&err=Name and code are required`);
    }

    const { error } = await supabase.from('branches').insert({
      tenant_id: activeTenantId,
      name,
      code,
      is_active: true,
    });

    if (error) {
      redirect(`/settings/branches?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/settings/branches');
    redirect(`/settings/branches?tenantId=${activeTenantId}&ok=Branch created successfully`);
  }

  async function toggleBranchAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const branchId = String(formData.get('branchId') || '');
    const currentActive = formData.get('currentActive') === 'true';

    const { error } = await supabase
      .from('branches')
      .update({ is_active: !currentActive })
      .eq('id', branchId)
      .eq('tenant_id', activeTenantId);

    if (error) {
      redirect(`/settings/branches?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/settings/branches');
    redirect(`/settings/branches?tenantId=${activeTenantId}&ok=Branch status updated`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Navigation breadcrumbs */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/receipts" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span>Settings</span>
            <span>/</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Branches (R12)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Branch Management
          </h1>
          <p className="text-xs text-neutral-500">
            Configure tenant physical and operational branches.
          </p>
        </div>
      </div>

      {/* Notifications */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Branch Creation Form */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Add New Branch
          </h2>
          <form action={createBranchAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Branch Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Matriz Norte"
                className="mt-1 block w-full rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Branch Code
              </label>
              <input
                type="text"
                name="code"
                required
                placeholder="e.g. UIO-01"
                className="mt-1 block w-full uppercase font-mono rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded bg-neutral-900 py-2 text-xs font-semibold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
            >
              + Create Branch
            </button>
          </form>
        </div>

        {/* Existing Branches Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Active & Inactive Branches ({branches?.length ?? 0})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
            <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {!branches || branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-neutral-500">
                    No branches configured.
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                      {b.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {b.code}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleBranchAction}>
                        <input type="hidden" name="branchId" value={b.id} />
                        <input type="hidden" name="currentActive" value={String(b.is_active)} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {b.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
