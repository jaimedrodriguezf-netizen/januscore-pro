import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { reviewReceipt, SelfApprovalError } from '@/lib/review/service';

export default async function ReceiptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { id } = await params;
  const queryParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-600">Por favor inicia sesión para ver los detalles del comprobante.</p>
      </main>
    );
  }

  // Fetch receipt with branch info
  const { data: receipt } = await supabase
    .from('receipts')
    .select('*, branches(name, code)')
    .eq('id', id)
    .maybeSingle();

  if (!receipt) {
    notFound();
  }

  // Fetch OCR extraction results
  const { data: extractions } = await supabase
    .from('extraction_results')
    .select('*')
    .eq('receipt_id', id)
    .order('created_at', { ascending: false })
    .limit(1);
  const extraction = extractions?.[0] ?? null;

  // Fetch QR verification results
  const { data: qrResults } = await supabase
    .from('qr_verifications')
    .select('*')
    .eq('receipt_id', id)
    .order('created_at', { ascending: false })
    .limit(1);
  const qrVerification = qrResults?.[0] ?? null;

  // Fetch Audit Trail (R8)
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('target_type', 'receipt')
    .eq('target_id', id)
    .order('created_at', { ascending: false });

  const isUploader = user.id === receipt.uploaded_by;
  const isTerminal = receipt.status === 'approved' || receipt.status === 'rejected';

  async function reviewAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/receipts/${id}?err=No%20autorizado`);
    }

    const action = formData.get('action') as 'approve' | 'reject';
    const reason = String(formData.get('reason') || '').trim();

    try {
      await reviewReceipt(supabase, {
        receiptId: id,
        actorId: user.id,
        action,
        reason: action === 'reject' ? reason : undefined,
      });
      revalidatePath(`/receipts/${id}`);
      revalidatePath('/receipts');
    } catch (err) {
      const msg = err instanceof SelfApprovalError ? err.message : err instanceof Error ? err.message : 'Error en la acción de revisión';
      redirect(`/receipts/${id}?err=${encodeURIComponent(msg)}`);
    }

    redirect(`/receipts/${id}?ok=1`);
  }

  const branchObj = Array.isArray(receipt.branches) ? receipt.branches[0] : receipt.branches;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/receipts"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
          >
            ← Volver a Comprobantes
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Comprobante: {receipt.original_filename}
          </h1>
          <p className="text-xs text-neutral-500">
            ID: <span className="font-mono">{receipt.id}</span> • Sucursal: {branchObj?.name} ({branchObj?.code})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {receipt.status === 'approved' ? 'Aprobado ✓' : receipt.status === 'rejected' ? 'Rechazado ✕' : receipt.status === 'needs_review' ? 'Requiere Revisión' : 'Pendiente'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {queryParams.ok && (
        <div className="mb-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ Comprobante actualizado y registrado en la bitácora de auditoría.
        </div>
      )}
      {queryParams.err && (
        <div className="mb-6 rounded-md bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {queryParams.err}
        </div>
      )}

      {/* Fraud Flag Warning (R4) */}
      {receipt.fraud_flag && (
        <div className="mb-6 border-l-4 border-rose-500 bg-rose-50 p-4 dark:bg-rose-950/40">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                ⚠️ Alerta de Posible Fraude Detectada
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                La firma criptográfica del código QR no coincidió con la clave pública Ed25519 del banco emisor. Inspecciona cuidadosamente el documento antes de tomar una decisión.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Details & OCR/QR */}
        <div className="space-y-6 lg:col-span-2">
          {/* File Storage Info */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Información del Archivo & Almacenamiento
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-neutral-500">Tipo de Archivo (MIME)</dt>
                <dd className="font-mono text-neutral-800 dark:text-neutral-200">{receipt.mime_type}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Tamaño</dt>
                <dd className="font-mono text-neutral-800 dark:text-neutral-200">{receipt.file_size} bytes</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Huella Criptográfica (SHA-256)</dt>
                <dd className="truncate font-mono text-neutral-800 dark:text-neutral-200">{receipt.file_sha256}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Fecha de Carga</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{new Date(receipt.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* OCR Extracted Data (R2) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Datos Extraídos por OCR (Capa de Sugerencia)
            </h2>
            {!extraction ? (
              <p className="mt-2 text-xs text-neutral-500">No hay extracción OCR registrada aún.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Motor:</span>
                  <span className="font-mono text-xs">{extraction.engine_name}</span>
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    Estado: {extraction.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-800/50">
                  {Object.entries(extraction.fields as Record<string, string>).map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-medium capitalize text-neutral-500">{k.replace('_', ' ')}</dt>
                      <dd className="font-semibold text-neutral-900 dark:text-neutral-100">{v || '—'}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* QR & Cryptographic Verification (R3, R4) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Verificación Criptográfica QR (Firma Digital)
            </h2>
            {!qrVerification ? (
              <p className="mt-2 text-xs text-neutral-500">No se detectó o validó código QR aún.</p>
            ) : (
              <div className="mt-3 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Banco Emisor:</span>
                  <span className="font-semibold">{qrVerification.bank}</span>
                  <span className="text-neutral-500">• Estado:</span>
                  <span className="font-bold uppercase text-neutral-800 dark:text-neutral-200">
                    {qrVerification.status === 'valid' ? 'Firma Válida ✓' : qrVerification.status === 'tampered' ? 'Adulterado ✕' : qrVerification.status}
                  </span>
                </div>
                {qrVerification.error && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Detalle: {qrVerification.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Review Actions & Audit Trail */}
        <div className="space-y-6">
          {/* Action Card (R6, R7) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Decisión de Revisión
            </h2>

            {isTerminal ? (
              <div className="mt-3 space-y-2 text-xs">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Este comprobante se encuentra en estado final <strong className="uppercase">{receipt.status}</strong>.
                </p>
                {receipt.reviewed_at && (
                  <p className="text-neutral-500">
                    Revisado el: {new Date(receipt.reviewed_at).toLocaleString()}
                  </p>
                )}
                {receipt.rejection_reason && (
                  <p className="text-rose-600 dark:text-rose-400">
                    Motivo: {receipt.rejection_reason}
                  </p>
                )}
              </div>
            ) : isUploader ? (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <strong>Separación de Funciones:</strong> Como tú cargaste este comprobante, no puedes auto-aprobarlo. Otro operador o administrador debe realizar la revisión.
              </div>
            ) : (
              <form action={reviewAction} className="mt-4 space-y-3">
                <label className="block text-xs">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Motivo de Rechazo (obligatorio si rechazas)
                  </span>
                  <input
                    type="text"
                    name="reason"
                    placeholder="Ej. Foto borrosa, titular no coincide"
                    className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    name="action"
                    value="approve"
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500"
                  >
                    Aprobar ✓
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="reject"
                    className="flex-1 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white shadow hover:bg-rose-500"
                  >
                    Rechazar ✕
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Audit Trail (R8) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Bitácora de Auditoría (Inmutable)
            </h2>
            {!auditLogs || auditLogs.length === 0 ? (
              <p className="mt-2 text-xs text-neutral-500">No hay eventos de auditoría registrados.</p>
            ) : (
              <ul className="mt-3 space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                {auditLogs.map((log) => (
                  <li key={log.id} className="pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.metadata && typeof log.metadata === 'object' && (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-neutral-500">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
