import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleBranchIds } from '@/lib/tenancy/branch';
import { calculateBranchMetrics, RawMetricReceipt } from '@/lib/metrics/aggregate';

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-neutral-600">Please sign in to view branch metrics.</p>
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
    .select('id, branch_id, status, fraud_flag, created_at, qr_verifications(status)')
    .in('branch_id', branchIds);

  if (params.branchId && params.branchId !== 'all') {
    query = query.eq('branch_id', params.branchId);
  }

  const { data: receipts } = await query;

  const rawMetricsList: RawMetricReceipt[] = (receipts || []).map((r) => {
    const qr = Array.isArray(r.qr_verifications) ? r.qr_verifications[0] : r.qr_verifications;
    return {
      id: r.id,
      branch_id: r.branch_id,
      status: r.status,
      fraud_flag: Boolean(r.fraud_flag),
      qr_status: qr?.status ?? null,
    };
  });

  const overallMetrics = calculateBranchMetrics(rawMetricsList);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Branch Verification Metrics
          </h1>
          <p className="text-sm text-neutral-500">
            Real-time analytics, QR verification rates, and fraud detection (R10)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/receipts/export${params.branchId ? `?branchId=${params.branchId}` : ''}`}
            download
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            ↓ Export CSV (R11)
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="mt-6 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Scope Branch:
          <select
            name="branchId"
            defaultValue={params.branchId ?? 'all'}
            className="ml-2 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Accessible Branches</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200"
        >
          Apply
        </button>
      </form>

      {/* Metrics Stat Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Total Receipts
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {overallMetrics.totalReceipts}
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            Pending: {overallMetrics.statusCounts.pending} • Review: {overallMetrics.statusCounts.needs_review}
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Approved Rate
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {overallMetrics.statusCounts.approved}
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            {overallMetrics.totalReceipts > 0
              ? `${((overallMetrics.statusCounts.approved / overallMetrics.totalReceipts) * 100).toFixed(1)}%`
              : '0%'} of total volume
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            QR Verified Rate
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {overallMetrics.qrVerifiedRatePercent.toFixed(1)}%
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            {overallMetrics.qrVerifiedCount} cryptographic signatures valid
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Fraud Flag Rate (R4)
          </dt>
          <dd
            className={`mt-2 text-3xl font-extrabold ${
              overallMetrics.fraudCount > 0 ? 'text-rose-600' : 'text-neutral-900 dark:text-neutral-100'
            }`}
          >
            {overallMetrics.fraudRatePercent.toFixed(1)}%
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            {overallMetrics.fraudCount} receipts flagged for signature failure
          </p>
        </div>
      </div>

      {/* Per-Branch Breakdown Table */}
      <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Per-Branch Summary (R10)
          </h2>
        </div>
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Approved</th>
              <th className="px-4 py-3">Needs Review</th>
              <th className="px-4 py-3">QR Verified %</th>
              <th className="px-4 py-3">Fraud Flags</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {!branches || branches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-xs text-neutral-500">
                  No branches configured.
                </td>
              </tr>
            ) : (
              branches.map((b) => {
                const branchReceipts = rawMetricsList.filter((r) => r.branch_id === b.id);
                const bMetrics = calculateBranchMetrics(branchReceipts);
                return (
                  <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {b.name} <span className="font-mono text-xs text-neutral-400">({b.code})</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{bMetrics.totalReceipts}</td>
                    <td className="px-4 py-3 text-xs text-emerald-600 font-semibold">{bMetrics.statusCounts.approved}</td>
                    <td className="px-4 py-3 text-xs text-orange-600 font-semibold">{bMetrics.statusCounts.needs_review}</td>
                    <td className="px-4 py-3 text-xs">{bMetrics.qrVerifiedRatePercent.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-xs">
                      {bMetrics.fraudCount > 0 ? (
                        <span className="font-bold text-rose-600">⚠️ {bMetrics.fraudCount}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/receipts?branchId=${b.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        View Receipts →
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
