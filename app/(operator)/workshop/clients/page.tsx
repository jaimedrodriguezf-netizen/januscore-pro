import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { WorkshopNavigation } from '@/components/mechanics/workshop-navigation';
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
  searchParams: Promise<{ tenantId?: string; q?: string }>;
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
          {filteredClients.map((client) => {
            const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : null;
            const waUrl = cleanPhone
              ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                  `Hola ${client.name}, te escribimos de ${tenantData?.name || 'nuestro taller mecánico'}.`
                )}`
              : null;

            return (
              <div
                key={client.clientKey}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  {/* Top Bar: Name & Badges */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">👤</span>
                        <h3 className="text-sm font-bold text-slate-100">{client.name}</h3>
                      </div>
                      {client.identification && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="text-slate-500">CI/RUC:</span>
                          <span className="font-mono font-semibold text-indigo-300">
                            {client.identification}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {client.isFleetOwner && (
                        <span className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 text-[10px] font-bold text-indigo-300">
                          🚗 Flota ({client.vehicles.length} autos)
                        </span>
                      )}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30 transition"
                        >
                          <span>📲 WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Contact Info & Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Teléfono:</span>
                      <span className="font-mono text-slate-200">
                        {client.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Correo Electrónico:</span>
                      <span className="text-slate-300 truncate block">
                        {client.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Mantenimientos Totales:</span>
                      <span className="font-bold text-indigo-300">
                        {client.totalServices} servicio{client.totalServices !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Último Mantenimiento:</span>
                      <span className="text-slate-300">
                        {client.lastServiceDate
                          ? new Date(client.lastServiceDate).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Sin registros'}
                      </span>
                    </div>
                  </div>

                  {/* Vehicles Portfolio */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Vehículos Registrados ({client.vehicles.length})
                    </span>
                    <div className="space-y-1.5">
                      {client.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                              {v.plate}
                            </span>
                            <span className="text-slate-300">
                              {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-slate-400">
                              {v.current_mileage.toLocaleString()} km
                            </span>
                            <a
                              href={`/auto/${v.plate}`}
                              target="_blank"
                              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                            >
                              Ficha ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
