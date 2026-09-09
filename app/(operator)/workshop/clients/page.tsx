import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { WorkshopNavigation } from '@/components/mechanics/workshop-navigation';
import { ClientCardItem } from '@/components/mechanics/client-card-item';
import { updateWorkshopClient } from '@/lib/mechanics/client-edit';
import {
  aggregateWorkshopClients,
  computeClientKPIs,
  filterWorkshopClients,
  type VehicleWithRecords,
} from '@/lib/mechanics/client-directory';

export const dynamic = 'force-dynamic';

export default async function WorkshopClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; q?: string; ok?: string; err?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const tenantIds = await getAccessibleTenantIds(supabase);
  const activeTenantId = params.tenantId || tenantIds[0];

  if (!activeTenantId) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-400">No hay organizaciones o talleres asignados a este usuario.</p>
      </div>
    );
  }

  // Fetch active tenant profile
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, name, slug, business_type')
    .eq('id', activeTenantId)
    .maybeSingle();

  const { data: isPlatformAdmin } = await supabase.rpc('am_i_platform_admin');
  if (!isPlatformAdmin && tenantData?.business_type === 'financial_receipts') {
    redirect('/');
  }

  // Server Action: Update client data across all vehicles in workshop
  async function updateClientAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const tId = String(formData.get('tenantId') || activeTenantId);
    const originalIdentification = String(formData.get('originalIdentification') || '').trim() || null;
    const originalName = String(formData.get('originalName') || '').trim() || null;
    const name = String(formData.get('name') || '').trim();
    const identification = String(formData.get('identification') || '').trim() || null;
    const phone = String(formData.get('phone') || '').trim() || null;
    const email = String(formData.get('email') || '').trim() || null;

    const result = await updateWorkshopClient(supabase, {
      tenantId: tId,
      originalIdentification,
      originalName,
      name,
      identification,
      phone,
      email,
    });

    if (!result.success) {
      redirect(`/workshop/clients?tenantId=${tId}&err=${encodeURIComponent(result.error || 'Error al actualizar cliente')}`);
    }

    revalidatePath('/workshop/clients');
    revalidatePath('/workshop');
    redirect(`/workshop/clients?tenantId=${tId}&ok=Cliente%20actualizado%20correctamente`);
  }

  // Fetch all vehicles in this tenant with their maintenance records
  const { data: rawVehicles } = await supabase
    .from('vehicles')
    .select('*, maintenance_records(id, service_date, mileage, service_type)')
    .eq('tenant_id', activeTenantId)
    .order('updated_at', { ascending: false });

  const vehicles = (rawVehicles || []) as VehicleWithRecords[];
  const allClients = aggregateWorkshopClients(vehicles);
  const kpis = computeClientKPIs(allClients, vehicles.length);
  const filteredClients = filterWorkshopClients(allClients, params.q);

  return (
    <div className="space-y-6">
      {/* Sub-module Navigation Bar */}
      <WorkshopNavigation
        tenantId={activeTenantId}
        totalVehicles={vehicles.length}
        workshopSlug={tenantData?.slug || 'taller'}
      />

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            CRM & Cartera del Taller
          </span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-100">
            Directorio de Clientes & Flotas
          </h1>
          <p className="text-xs text-slate-400">
            Padrón consolidado de clientes, portafolio de vehículos por propietario y contacto directo
          </p>
        </div>

        <Link
          href={`/workshop?tenantId=${activeTenantId}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition self-start sm:self-auto"
        >
          <span>← Volver al Tablero Principal</span>
        </Link>
      </div>

      {/* Notifications */}
      {params.ok && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs font-medium text-emerald-300">
          ✓ {params.ok}
        </div>
      )}
      {params.err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/40 p-3 text-xs font-medium text-rose-300">
          ⚠️ {params.err}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">👥 Total Clientes</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{kpis.totalClients}</p>
          <span className="text-[10px] text-slate-500">Clientes únicos registrados</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">🚗 Clientes con Flota</span>
          <p className="mt-1 text-2xl font-extrabold text-indigo-400">{kpis.fleetClientsCount}</p>
          <span className="text-[10px] text-indigo-400/70">Poseen 2 o más vehículos</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">🏎️ Vehículos Totales</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{kpis.totalVehicles}</p>
          <span className="text-[10px] text-slate-500">Padrón vehicular del taller</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">🛠️ Servicios Realizados</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">{kpis.totalServices}</p>
          <span className="text-[10px] text-emerald-400/70">Mantenimientos acumulados</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <div className="text-xs text-slate-300">
          Mostrando <span className="font-bold text-white">{filteredClients.length}</span> de{' '}
          <span className="font-bold text-slate-400">{allClients.length}</span> clientes
        </div>

        <form method="GET" className="flex items-center gap-2">
          <input type="hidden" name="tenantId" value={activeTenantId} />
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Buscar por cliente, cédula, teléfono o placa..."
            className="w-full sm:w-80 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm shrink-0"
          >
            Buscar
          </button>
          {params.q && (
            <Link
              href={`/workshop/clients?tenantId=${activeTenantId}`}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition shrink-0"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Clients Directory List */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <span className="text-3xl">🔍</span>
          <h3 className="mt-3 text-sm font-bold text-slate-200">No se encontraron clientes</h3>
          <p className="mt-1 text-xs text-slate-400">
            {params.q
              ? `No hay coincidencias para "${params.q}". Intenta con otro término de búsqueda.`
              : 'Aún no hay clientes con vehículos registrados en este taller.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredClients.map((client) => (
            <ClientCardItem
              key={client.clientKey}
              client={client}
              tenantId={activeTenantId}
              tenantName={tenantData?.name || ''}
              updateAction={updateClientAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
