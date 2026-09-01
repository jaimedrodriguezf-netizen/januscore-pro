import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { getMyRole } from '@/lib/tenancy/role';

export default async function UsersAdminPage({
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
        <p className="text-sm text-neutral-600">Por favor inicia sesión para ver los usuarios.</p>
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

  // Fetch branches
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, code')
    .eq('tenant_id', activeTenantId)
    .order('name');

  // Fetch tenant memberships with profile info
  const { data: memberships } = await supabase
    .from('tenant_memberships')
    .select('id, user_id, role, created_at, profiles(id, email, full_name)')
    .eq('tenant_id', activeTenantId);

  // Fetch branch memberships
  const { data: branchMemberships } = await supabase
    .from('branch_memberships')
    .select('id, user_id, branch_id, is_default, branches(name, code)')
    .eq('tenant_id', activeTenantId);

  async function updateRoleAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const membershipId = String(formData.get('membershipId') || '');
    const newRole = formData.get('role') as 'tenant_admin' | 'operator' | 'client';

    const { error } = await supabase
      .from('tenant_memberships')
      .update({ role: newRole })
      .eq('id', membershipId)
      .eq('tenant_id', activeTenantId);

    if (error) {
      redirect(`/settings/users?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/settings/users');
    redirect(`/settings/users?tenantId=${activeTenantId}&ok=Rol%20de%20usuario%20actualizado`);
  }

  async function assignBranchAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const userId = String(formData.get('userId') || '');
    const branchId = String(formData.get('branchId') || '');

    if (!userId || !branchId) {
      redirect(`/settings/users?tenantId=${activeTenantId}&err=Falta%20usuario%20o%20sucursal`);
    }

    const { error } = await supabase.from('branch_memberships').insert({
      user_id: userId,
      tenant_id: activeTenantId,
      branch_id: branchId,
      role: 'operator',
      is_default: false,
    });

    if (error) {
      redirect(`/settings/users?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/settings/users');
    redirect(`/settings/users?tenantId=${activeTenantId}&ok=Sucursal%20asignada%20con%20%C3%A9xito`);
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
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Usuarios & Roles</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Roles de Usuario & Asignación de Sucursales
          </h1>
          <p className="text-xs text-neutral-500">
            Administra administradores, operadores, clientes y las sucursales a las que tienen acceso.
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

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Miembros de la Organización ({memberships?.length ?? 0})
          </h2>
        </div>
        <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
          <thead className="bg-neutral-50 font-medium text-neutral-500 dark:bg-neutral-800/50">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol Asignado</th>
              <th className="px-4 py-3">Sucursales Asignadas</th>
              <th className="px-4 py-3 text-right">Asignar Sucursal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {!memberships || memberships.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-neutral-400">
                  No se encontraron miembros registrados en esta organización.
                </td>
              </tr>
            ) : (
              memberships.map((m) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                const userBranches = (branchMemberships ?? []).filter((bm) => bm.user_id === m.user_id);
                return (
                  <tr key={m.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      <div>{profile?.full_name || '—'}</div>
                      <div className="font-mono text-[11px] text-neutral-500">{profile?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateRoleAction} className="inline-flex items-center gap-2">
                        <input type="hidden" name="membershipId" value={m.id} />
                        <select
                          name="role"
                          defaultValue={m.role}
                          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="client">Cliente</option>
                          <option value="operator">Operador / Mecánico</option>
                          <option value="tenant_admin">Administrador</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          Guardar
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {userBranches.length === 0 ? (
                          <span className="text-[11px] text-neutral-400">Todas (Admin) / Ninguna</span>
                        ) : (
                          userBranches.map((ub) => {
                            const b = Array.isArray(ub.branches) ? ub.branches[0] : ub.branches;
                            return (
                              <span
                                key={ub.id}
                                className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {b?.name} ({b?.code})
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={assignBranchAction} className="inline-flex items-center gap-1">
                        <input type="hidden" name="userId" value={m.user_id} />
                        <select
                          name="branchId"
                          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[11px] dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          {branches?.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.code}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-indigo-500"
                        >
                          + Asignar
                        </button>
                      </form>
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
