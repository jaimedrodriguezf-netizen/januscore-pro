import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { uploadReceiptOriginal } from '@/lib/upload/storage';
import { registerReceipt } from '@/lib/upload/register';

export default async function ClientPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch accessible branches for upload (or tenant branches)
  const { data: branches } = await supabase
    .from('branches')
    .select('id, tenant_id, name, code')
    .eq('is_active', true)
    .order('name');

  // Fetch receipts uploaded by this user (RLS enforces isolation)
  const { data: myReceipts } = await supabase
    .from('receipts')
    .select('id, branch_id, status, original_filename, file_size, created_at, rejection_reason, branches(name, code), extraction_results(fields), qr_verifications(status)')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false });

  const total = myReceipts?.length ?? 0;
  const approved = myReceipts?.filter((r) => r.status === 'approved').length ?? 0;
  const pending = myReceipts?.filter((r) => r.status === 'pending' || r.status === 'needs_review').length ?? 0;
  const rejected = myReceipts?.filter((r) => r.status === 'rejected').length ?? 0;

  async function uploadClientReceiptAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const branchId = String(formData.get('branchId') || '');
    const file = formData.get('file');

    if (!branchId || !(file instanceof File) || file.size === 0) {
      redirect('/portal?err=Seleccione%20un%20archivo%20y%20sucursal');
    }

    const { data: branch } = await supabase
      .from('branches')
      .select('id, tenant_id')
      .eq('id', branchId)
      .maybeSingle();

    if (!branch) {
      redirect('/portal?err=Sucursal%20inv%C3%A1lida');
    }

    try {
      const uploaded = await uploadReceiptOriginal(supabase, {
        tenantId: branch.tenant_id,
        branchId: branch.id,
        fileId: crypto.randomUUID(),
        file,
        contentType: file.type || 'application/octet-stream',
        originalFilename: file.name,
      });

      const receipt = await registerReceipt(
        supabase,
        { tenantId: branch.tenant_id, branchId: branch.id, uploadedBy: user.id },
        uploaded,
      );

      // Trigger OCR + QR extraction pipeline in background
      try {
        fetch(`http://localhost:3000/api/receipts/${receipt.id}/extract`, {
          method: 'POST',
        }).catch(() => {});
      } catch {
        // non-blocking trigger
      }

      revalidatePath('/portal');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir comprobante';
      redirect(`/portal?err=${encodeURIComponent(msg)}`);
    }

    redirect('/portal?ok=Comprobante%20subido%20exitosamente');
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-neutral-100">
      {/* Top Navbar */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Portal de Clientes
            </span>
            <h1 className="text-xl font-extrabold tracking-tight">JanusCore Pro</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Banner notifications */}
        {params.ok && (
          <div className="mb-6 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✓ {params.ok}
          </div>
        )}
        {params.err && (
          <div className="mb-6 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            ⚠️ {params.err}
          </div>
        )}

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[11px] font-medium text-neutral-500">Total Subidos</span>
            <div className="mt-1 text-2xl font-bold">{total}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Aprobados</span>
            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approved}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">En Verificación</span>
            <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Observados</span>
            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{rejected}</div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-base font-bold">Enviar Nuevo Comprobante de Pago</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Subí tu foto o captura de transferencia (Banco Pichincha, Guayaquil, Deuna). El sistema validará automáticamente la firma digital y el monto.
          </p>

          <form action={uploadClientReceiptAction} encType="multipart/form-data" className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Sucursal / Destino
              </label>
              <select
                name="branchId"
                required
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
              >
                {!branches || branches.length === 0 ? (
                  <option value="">No hay sucursales disponibles</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Imagen o PDF del Comprobante
              </label>
              <input
                type="file"
                name="file"
                accept="image/*,application/pdf"
                required
                className="mt-1 block w-full text-xs text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-neutral-100 dark:file:text-neutral-900"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-500"
            >
              Subir Comprobante para Verificación →
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-bold">Mis Comprobantes Enviados</h2>
          </div>

          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Archivo</th>
                <th className="px-6 py-3">Sucursal</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {!myReceipts || myReceipts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                    Aún no has enviado comprobantes.
                  </td>
                </tr>
              ) : (
                myReceipts.map((r) => {
                  const branch = Array.isArray(r.branches) ? r.branches[0] : r.branches;
                  const statusBadges: Record<string, { text: string; class: string }> = {
                    pending: { text: 'En Verificación', class: 'bg-amber-50 text-amber-700 border-amber-200' },
                    needs_review: { text: 'En Revisión', class: 'bg-orange-50 text-orange-700 border-orange-200' },
                    approved: { text: 'Aprobado ✓', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    rejected: { text: 'Rechazado ✕', class: 'bg-rose-50 text-rose-700 border-rose-200' },
                  };
                  const badge = statusBadges[r.status] || { text: r.status, class: 'bg-neutral-100 text-neutral-700' };

                  return (
                    <tr key={r.id} className="hover:bg-neutral-50/50">
                      <td className="whitespace-nowrap px-6 py-3 text-neutral-500">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {r.original_filename}
                      </td>
                      <td className="px-6 py-3 text-neutral-500">
                        {branch?.name} ({branch?.code})
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.class}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-neutral-500">
                        {r.rejection_reason ? (
                          <span className="text-rose-600 font-medium">Motivo: {r.rejection_reason}</span>
                        ) : r.status === 'approved' ? (
                          <span className="text-emerald-600 font-medium">Pago confirmado</span>
                        ) : (
                          'Procesando firma y OCR'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
