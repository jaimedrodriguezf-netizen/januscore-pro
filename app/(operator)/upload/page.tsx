import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleBranchIds } from '@/lib/tenancy/branch';
import { uploadReceiptOriginal } from '@/lib/upload/storage';
import { registerReceipt } from '@/lib/upload/register';

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const branchIds = user
    ? await getAccessibleBranchIds(supabase)
    : [];
  const { data: branches } = branchIds.length
    ? await supabase
        .from('branches')
        .select('id, name, code')
        .in('id', branchIds)
        .eq('is_active', true)
        .order('name')
    : { data: [] };

  const params = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-10 font-sans">
      <h1 className="text-2xl font-bold">Cargar Comprobante</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Los archivos originales se almacenan de forma inmutable y con validación criptográfica.
      </p>

      {params.ok ? (
        <p className="mt-4 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ Comprobante registrado exitosamente en estado pendiente.
        </p>
      ) : null}
      {params.err ? (
        <p className="mt-4 rounded bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {params.err}
        </p>
      ) : null}

      {!user ? (
        <p className="mt-6 text-sm text-neutral-700 dark:text-neutral-300">Inicia sesión para cargar un comprobante.</p>
      ) : !branches?.length ? (
        <p className="mt-6 text-sm text-neutral-700 dark:text-neutral-300">
          No perteneces a ninguna sucursal activa. Solicita al administrador que te asigne una sucursal.
        </p>
      ) : (
        <form action={uploadReceiptAction} encType="multipart/form-data" className="mt-6 space-y-4">
          <label className="block text-xs font-medium">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Sucursal de Destino</span>
            <select
              name="branchId"
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Imagen o PDF del Comprobante</span>
            <input
              type="file"
              name="file"
              accept="image/*,application/pdf"
              required
              className="mt-1 block w-full text-xs text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-neutral-100 dark:file:text-neutral-900"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Subir y Procesar Comprobante →
          </button>
        </form>
      )}
    </main>
  );
}

async function uploadReceiptAction(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/upload?err=No%20autorizado');

  const branchId = String(formData.get('branchId') ?? '');
  const file = formData.get('file');
  if (!branchId || !(file instanceof File) || file.size === 0) {
    redirect('/upload?err=Falta%20seleccionar%20sucursal%20o%20archivo');
  }

  const { data: branch } = await supabase
    .from('branches')
    .select('id, tenant_id')
    .eq('id', branchId)
    .maybeSingle();
  if (!branch) redirect('/upload?err=No%20tienes%20permiso%20para%20esa%20sucursal');

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

    try {
      fetch(`http://localhost:3000/api/receipts/${receipt.id}/extract`, {
        method: 'POST',
      }).catch(() => {});
    } catch {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al subir comprobante';
    redirect(`/upload?err=${encodeURIComponent(msg)}`);
  }
  redirect('/upload?ok=1');
}
