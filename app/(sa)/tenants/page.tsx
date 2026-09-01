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
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-600">Por favor inicia sesión para acceder al panel de superadministrador.</p>
      </main>
    );
  }

  // Check platform superadmin status
  const { data: isPlatformAdmin } = await supabase.rpc('am_i_platform_admin');
  if (!isPlatformAdmin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <div className="rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          ⚠️ Acceso Denegado: Se requieren privilegios de Superadministrador de la Plataforma.
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
      redirect(`/tenants?err=El%20nombre%20y%20slug%20son%20obligatorios`);
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
    redirect('/tenants?ok=Organizaci%C3%B3n%20aprovisionada%20con%20%C3%A9xito');
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
    redirect('/tenants?ok=Estado%20de%20la%20organizaci%C3%B3n%20actualizado');
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 font-sans">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <span>Superadministrador</span>
            <span>/</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Organizaciones Multi-inquilino</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Gestión de Organizaciones & Inquilinos
          </h1>
          <p className="text-xs text-neutral-500">
            Aprovisiona y administra instancias empresariales y aislamiento de datos.
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
            Aprovisionar Nueva Organización
          </h2>
          <form action={createTenantAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Nombre de la Empresa / Organización
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej. Taller Mecánico Central"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Slug (Identificador URL único)
              </label>
              <input
                type="text"
                name="slug"
                required
                placeholder="Ej. taller-central"
                className="mt-1 block w-full font-mono rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
            >
              + Aprovisionar Organización
            </button>
          </form>
        </div>

        {/* Tenants Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Organizaciones Activas ({tenants?.length ?? 0})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
            <thead className="bg-neutral-50 font-medium text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {!tenants || tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-neutral-400">
                    No hay organizaciones registradas.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                      {t.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          t.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {t.is_active ? 'Activa ✓' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleTenantAction}>
                        <input type="hidden" name="tenantId" value={t.id} />
                        <input type="hidden" name="currentActive" value={String(t.is_active)} />
                        <button
                          type="submit"
                          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {t.is_active ? 'Desactivar' : 'Activar'}
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
