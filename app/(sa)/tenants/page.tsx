import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function SuperadminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const queryParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-neutral-600">Please sign in to access superadmin panel.</p>
      </main>
    );
  }

  // Check platform superadmin status
  const { data: isPlatformAdmin } = await supabase.rpc('am_i_platform_admin');
  if (!isPlatformAdmin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-md bg-rose-50 p-4 text-sm text-rose-800">
          <strong>Access Denied (R12):</strong> Platform Superadmin privilege required.
        </div>
      </main>
    );
  }

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  async function createTenantAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const name = String(formData.get('name') || '').trim();
    const slug = String(formData.get('slug') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (!name || !slug) {
      redirect(`/tenants?err=Tenant name and slug are required`);
    }

    const { error } = await supabase.from('tenants').insert({
      name,
      slug,
      is_active: true,
    });

    if (error) {
      redirect(`/tenants?err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/tenants');
    redirect('/tenants?ok=Tenant provisioned successfully (R12)');
  }

  async function toggleTenantAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const tenantId = String(formData.get('tenantId') || '');
    const currentActive = formData.get('currentActive') === 'true';

    const { error } = await supabase
      .from('tenants')
      .update({ is_active: !currentActive })
      .eq('id', tenantId);

    if (error) {
      redirect(`/tenants?err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/tenants');
    redirect('/tenants?ok=Tenant status updated');
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/receipts" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span>Superadmin</span>
            <span>/</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Tenants (R12)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Platform Tenants Management (Superadmin)
          </h1>
          <p className="text-xs text-neutral-500">
            Provision and manage multi-tenant enterprise instances.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Provision New Tenant
          </h2>
          <form action={createTenantAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Organization / Tenant Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Acme Financial Group"
                className="mt-1 block w-full rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Slug (URL & identifier)
              </label>
              <input
                type="text"
                name="slug"
                required
                placeholder="e.g. acme-financial"
                className="mt-1 block w-full font-mono rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded bg-neutral-900 py-2 text-xs font-semibold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
            >
              + Provision Tenant
            </button>
          </form>
        </div>

        {/* Tenants Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Provisioned Tenants ({tenants?.length ?? 0})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
            <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {!tenants || tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-neutral-500">
                    No tenants found.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {t.slug}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          t.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleTenantAction}>
                        <input type="hidden" name="tenantId" value={t.id} />
                        <input type="hidden" name="currentActive" value={String(t.is_active)} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {t.is_active ? 'Deactivate' : 'Activate'}
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
