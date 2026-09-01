import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { getMyRole } from '@/lib/tenancy/role';
import { listBankPublicKeys, addBankPublicKey, toggleBankPublicKeyStatus } from '@/lib/admin/keys';

export default async function BankKeysAdminPage({
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
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-600">Por favor inicia sesión para ver las claves públicas bancarias.</p>
      </main>
    );
  }

  const tenantIds = await getAccessibleTenantIds(supabase);
  const activeTenantId = queryParams.tenantId || tenantIds[0];

  if (!activeTenantId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-600">No se encontró una organización activa.</p>
      </main>
    );
  }

  const role = await getMyRole(supabase, activeTenantId);
  if (role !== 'tenant_admin' && role !== 'platform_admin') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <div className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          ⚠️ Acceso Restringido: Se requieren privilegios de Administrador o Superadministrador.
        </div>
      </main>
    );
  }

  const keys = await listBankPublicKeys(supabase, activeTenantId);

  async function addKeyAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const bank = String(formData.get('bank') || '').trim();
    const publicKeyHex = String(formData.get('publicKeyHex') || '').trim();

    try {
      await addBankPublicKey(supabase, {
        tenantId: activeTenantId,
        bank,
        publicKeyHex,
        createdBy: user?.id,
      });
      revalidatePath('/settings/keys');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar clave pública bancaria';
      redirect(`/settings/keys?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/keys?tenantId=${activeTenantId}&ok=Clave%20p%C3%BAblica%20registrada%20con%20%C3%A9xito`);
  }

  async function toggleKeyAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const keyId = String(formData.get('keyId') || '');
    const currentActive = formData.get('currentActive') === 'true';

    try {
      await toggleBankPublicKeyStatus(supabase, keyId, !currentActive, activeTenantId);
      revalidatePath('/settings/keys');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado de la clave';
      redirect(`/settings/keys?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/keys?tenantId=${activeTenantId}&ok=Estado%20de%20la%20clave%20actualizado`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 font-sans">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <span>Configuración</span>
            <span>/</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Claves Públicas Bancarias</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Claves Públicas & Validación Criptográfica
          </h1>
          <p className="text-xs text-neutral-500">
            Claves públicas Ed25519 utilizadas para validar la autenticidad de firmas en códigos QR.
          </p>
        </div>
      </div>

      {queryParams.ok && (
        <div className="mb-6 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {queryParams.ok}
        </div>
      )}
      {queryParams.err && (
        <div className="mb-6 rounded-md bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {queryParams.err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Registrar Nueva Clave Pública
          </h2>
          <form action={addKeyAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Banco Emisor
              </label>
              <select
                name="bank"
                defaultValue="Pichincha"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="Pichincha">Banco Pichincha (v1)</option>
                <option value="Guayaquil">Banco Guayaquil</option>
                <option value="Deuna">Deuna!</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Clave Pública (64 caracteres hexadecimales)
              </label>
              <textarea
                name="publicKeyHex"
                rows={3}
                required
                placeholder="Ej. 5d949449be3e3b7b686d1ffcf0b..."
                className="mt-1 block w-full font-mono text-[11px] rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
            >
              + Registrar Clave Pública
            </button>
          </form>
        </div>

        {/* Keys Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Claves Registradas ({keys.length})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
            <thead className="bg-neutral-50 font-medium text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3">Banco</th>
                <th className="px-4 py-3">Clave Pública (Hex)</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-neutral-400">
                    No hay claves públicas registradas.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      {k.bank}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      <span title={k.public_key}>
                        {k.public_key.slice(0, 16)}...{k.public_key.slice(-8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          k.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                        }`}
                      >
                        {k.is_active ? 'Activa ✓' : 'Desactivada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleKeyAction}>
                        <input type="hidden" name="keyId" value={k.id} />
                        <input type="hidden" name="currentActive" value={String(k.is_active)} />
                        <button
                          type="submit"
                          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {k.is_active ? 'Desactivar' : 'Activar'}
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
