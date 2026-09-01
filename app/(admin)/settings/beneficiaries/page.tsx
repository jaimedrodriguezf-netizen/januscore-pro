import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { getMyRole } from '@/lib/tenancy/role';
import {
  listBeneficiaries,
  addBeneficiary,
  toggleBeneficiaryStatus,
  deleteBeneficiary,
} from '@/lib/admin/beneficiaries';

export default async function BeneficiariesAdminPage({
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
        <p className="text-sm text-neutral-600">Please sign in to view beneficiary accounts.</p>
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
          <strong>Access Restricted (R15):</strong> Tenant Admin or Platform Superadmin privilege required.
        </div>
      </main>
    );
  }

  const beneficiaries = await listBeneficiaries(supabase, activeTenantId);

  async function addBeneficiaryAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const bank = String(formData.get('bank') || '').trim();
    const accountNumber = String(formData.get('accountNumber') || '').trim();
    const accountHolder = String(formData.get('accountHolder') || '').trim();

    try {
      await addBeneficiary(supabase, {
        tenantId: activeTenantId,
        bank,
        accountNumber,
        accountHolder,
      });
      revalidatePath('/settings/beneficiaries');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add beneficiary';
      redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&ok=Beneficiary account configured`);
  }

  async function toggleStatusAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const id = String(formData.get('id') || '');
    const currentActive = formData.get('currentActive') === 'true';

    try {
      await toggleBeneficiaryStatus(supabase, id, !currentActive);
      revalidatePath('/settings/beneficiaries');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status';
      redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&ok=Account status updated`);
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const id = String(formData.get('id') || '');

    try {
      await deleteBeneficiary(supabase, id);
      revalidatePath('/settings/beneficiaries');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&ok=Beneficiary account removed`);
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
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Beneficiary Accounts (R15)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Beneficiary Accounts Configuration
          </h1>
          <p className="text-xs text-neutral-500">
            Configure expected receiving accounts for automated beneficiary matching (R5, R15).
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
            Add Beneficiary Account
          </h2>
          <form action={addBeneficiaryAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Bank
              </label>
              <input
                type="text"
                name="bank"
                required
                placeholder="e.g. Banco Pichincha"
                className="mt-1 block w-full rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                required
                placeholder="e.g. 2200112233"
                className="mt-1 block w-full font-mono rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Account Holder Name
              </label>
              <input
                type="text"
                name="accountHolder"
                required
                placeholder="e.g. Netizen Corp SA"
                className="mt-1 block w-full rounded border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded bg-neutral-900 py-2 text-xs font-semibold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
            >
              + Configure Beneficiary
            </button>
          </form>
        </div>

        {/* Beneficiaries Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Beneficiary Accounts ({beneficiaries.length})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
            <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3">Bank & Account</th>
                <th className="px-4 py-3">Account Holder</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-neutral-500">
                    No beneficiary accounts configured yet.
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{b.bank}</div>
                      <div className="font-mono text-neutral-500 text-[11px]">{b.account_number}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-800 dark:text-neutral-200">
                      {b.account_holder}
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
                    <td className="px-4 py-3 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleStatusAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="currentActive" value={String(b.is_active)} />
                          <button
                            type="submit"
                            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {b.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>
                        <form action={deleteAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <button
                            type="submit"
                            className="font-medium text-rose-600 hover:underline dark:text-rose-400"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
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
