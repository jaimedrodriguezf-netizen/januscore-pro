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
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-600">Por favor inicia sesión para ver las métricas.</p>
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
    <main className="mx-auto max-w-6xl px-4 py-8 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Métricas de Verificación & Fraude
          </h1>
          <p className="text-sm text-neutral-500">
            Analítica en tiempo real por sucursal, tasa de validación QR y alertas de seguridad
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/receipts/export${params.branchId ? `?branchId=${params.branchId}` : ''}`}
            download
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            ↓ Exportar Reporte CSV
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="mt-6 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Filtrar por Sucursal:
          <select
            name="branchId"
            defaultValue={params.branchId ?? 'all'}
            className="ml-2 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">Todas las sucursales accesibles</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200"
        >
          Aplicar Filtro
        </button>
      </form>

      {/* Metrics Stat Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Comprobantes
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {overallMetrics.totalReceipts}
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            Pendientes: {overallMetrics.statusCounts.pending} • En Revisión: {overallMetrics.statusCounts.needs_review}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Tasa de Aprobación
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {overallMetrics.statusCounts.approved}
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            {overallMetrics.totalReceipts > 0
              ? `${((overallMetrics.statusCounts.approved / overallMetrics.totalReceipts) * 100).toFixed(1)}%`
              : '0%'} del volumen total
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Validación QR Exitosa
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {overallMetrics.qrVerifiedRatePercent.toFixed(1)}%
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            {overallMetrics.qrVerifiedCount} firmas criptográficas válidas
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Tasa de Alertas de Fraude
          </dt>
          <dd
            className={`mt-2 text-3xl font-extrabold ${
              overallMetrics.fraudCount > 0 ? 'text-rose-600' : 'text-neutral-900 dark:text-neutral-100'
            }`}
          >
            {overallMetrics.fraudRatePercent.toFixed(1)}%
          </dd>
          <p className="mt-1 text-[11px] text-neutral-400">
            {overallMetrics.fraudCount} comprobantes con firma inválida
          </p>
        </div>
      </div>

      {/* Per-Branch Breakdown Table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Resumen por Sucursal
          </h2>
        </div>
        <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
          <thead className="bg-neutral-50 font-medium text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Aprobados</th>
              <th className="px-4 py-3">En Revisión</th>
              <th className="px-4 py-3">% Verificados QR</th>
              <th className="px-4 py-3">Alertas Fraude</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {!branches || branches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-xs text-neutral-400">
                  No hay sucursales configuradas.
                </td>
              </tr>
            ) : (
              branches.map((b) => {
                const branchReceipts = rawMetricsList.filter((r) => r.branch_id === b.id);
                const bMetrics = calculateBranchMetrics(branchReceipts);
                return (
                  <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      {b.name} <span className="font-mono text-xs text-neutral-400">({b.code})</span>
                    </td>
                    <td className="px-4 py-3">{bMetrics.totalReceipts}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">{bMetrics.statusCounts.approved}</td>
                    <td className="px-4 py-3 text-orange-600 font-bold">{bMetrics.statusCounts.needs_review}</td>
                    <td className="px-4 py-3">{bMetrics.qrVerifiedRatePercent.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      {bMetrics.fraudCount > 0 ? (
                        <span className="font-bold text-rose-600">⚠️ {bMetrics.fraudCount}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/receipts?branchId=${b.id}`}
                        className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Ver Comprobantes →
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
