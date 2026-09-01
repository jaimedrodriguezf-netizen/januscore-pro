import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleBranchIds } from '@/lib/tenancy/branch';

export default async function ReceiptsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    branchId?: string;
    fraud?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-neutral-600">Please sign in to view receipts.</p>
      </main>
    );
  }

  const branchIds = await getAccessibleBranchIds(supabase);
  const { data: branches } = branchIds.length
    ? await supabase
        .from('branches')
        .select('id, name, code')
        .in('id', branchIds)
        .eq('is_active', true)
        .order('name')
    : { data: [] };

  let query = supabase
    .from('receipts')
    .select('id, branch_id, status, storage_path, original_filename, file_size, fraud_flag, created_at, branches(name, code)')
    .order('created_at', { ascending: false });

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.branchId && params.branchId !== 'all') {
    query = query.eq('branch_id', params.branchId);
  }
  if (params.fraud === '1') {
    query = query.eq('fraud_flag', true);
  }

  const { data: receipts } = await query;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Receipts Repository
          </h1>
          <p className="text-sm text-neutral-500">
            Branch-scoped receipt verification & human review (R6, R9)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Upload receipt
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Status:
          <select
            name="status"
            defaultValue={params.status ?? 'all'}
            className="ml-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="needs_review">Needs Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Branch:
          <select
            name="branchId"
            defaultValue={params.branchId ?? 'all'}
            className="ml-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All branches</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            name="fraud"
            value="1"
            defaultChecked={params.fraud === '1'}
            className="rounded border-neutral-300"
          />
          Fraud Flagged Only (R4)
        </label>

        <button
          type="submit"
          className="ml-auto rounded bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200"
        >
          Filter
        </button>
      </form>

      {/* Receipts Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signals</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {!receipts || receipts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  No receipts found matching your criteria.
                </td>
              </tr>
            ) : (
              receipts.map((r) => {
                const branchObj = Array.isArray(r.branches) ? r.branches[0] : r.branches;
                const statusStyles: Record<string, string> = {
                  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
                  needs_review: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
                  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
                  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
                };
                return (
                  <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {r.original_filename}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                      {branchObj ? `${branchObj.name} (${branchObj.code})` : r.branch_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          statusStyles[r.status] || 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.fraud_flag ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          ⚠️ Fraud Flag
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/receipts/${r.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Review →
                      </Link>
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
