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
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-600">Por favor inicia sesión para ver las cuentas beneficiarias.</p>
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
      const msg = err instanceof Error ? err.message : 'Error al registrar cuenta beneficiaria';
      redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&ok=Cuenta%20beneficiaria%20configurada%20con%20%C3%A9xito`);
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
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado de la cuenta';
      redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&ok=Estado%20de%20la%20cuenta%20actualizado`);
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const id = String(formData.get('id') || '');

    try {
      await deleteBeneficiary(supabase, id);
      revalidatePath('/settings/beneficiaries');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar cuenta';
      redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&err=${encodeURIComponent(msg)}`);
    }

    redirect(`/settings/beneficiaries?tenantId=${activeTenantId}&ok=Cuenta%20beneficiaria%20eliminada`);
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
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Cuentas Beneficiarias</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Configuración de Cuentas Beneficiarias
          </h1>
          <p className="text-xs text-neutral-500">
            Cuentas bancarias de destino autorizadas para conciliación automática y alertas de desvío de fondos.
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
            Agregar Cuenta de Destino
          </h2>
          <form action={addBeneficiaryAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Institución Financiera
              </label>
              <input
                type="text"
                name="bank"
                required
                placeholder="Ej. Banco Pichincha, Produbanco"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Número de Cuenta
              </label>
              <input
                type="text"
                name="accountNumber"
                required
                placeholder="Ej. 2200112233"
                className="mt-1 block w-full font-mono rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Nombre del Titular / Razón Social
              </label>
              <input
                type="text"
                name="accountHolder"
                required
                placeholder="Ej. Corporación JanusCore SA"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
            >
              + Guardar Cuenta Beneficiaria
            </button>
          </form>
        </div>

        {/* Beneficiaries Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Cuentas Registradas ({beneficiaries.length})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
            <thead className="bg-neutral-50 font-medium text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3">Banco & Número</th>
                <th className="px-4 py-3">Titular Registrado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-neutral-400">
                    No hay cuentas beneficiarias configuradas aún.
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{b.bank}</div>
                      <div className="font-mono text-neutral-500 text-[11px]">{b.account_number}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">
                      {b.account_holder}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {b.is_active ? 'Activa ✓' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <form action={toggleStatusAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="currentActive" value={String(b.is_active)} />
                          <button
                            type="submit"
                            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {b.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </form>
                        <form action={deleteAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <button
                            type="submit"
                            className="font-semibold text-rose-600 hover:underline dark:text-rose-400"
                          >
                            Eliminar
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
