import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { WorkshopNavigation } from '@/components/mechanics/workshop-navigation';
import { buildClientDetailedProfile, type VehicleWithFullRecords } from '@/lib/mechanics/client-history';
import { CopyButton } from '@/components/ui/copy-button';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientKey: string }>;
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { clientKey } = await params;
  const sParams = await searchParams;
  const decodedClientKey = decodeURIComponent(clientKey);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const tenantIds = await getAccessibleTenantIds(supabase);
  const activeTenantId = sParams.tenantId || tenantIds[0];

  if (!activeTenantId) {
    redirect('/workshop');
  }

  // Fetch active tenant profile
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, name, slug, business_type')
    .eq('id', activeTenantId)
    .maybeSingle();

  // Fetch all vehicles with full maintenance records for this tenant
  const { data: vehiclesData } = await supabase
    .from('vehicles')
    .select('*, maintenance_records(*)')
    .eq('tenant_id', activeTenantId);

  const profile = buildClientDetailedProfile(
    decodedClientKey,
    (vehiclesData || []) as VehicleWithFullRecords[]
  );

  const totalVehiclesCount = vehiclesData?.length || 0;

  if (!profile) {
    return (
      <div className="space-y-6">
        <WorkshopNavigation
          tenantId={activeTenantId}
          totalVehicles={totalVehiclesCount}
          workshopSlug={tenantData?.slug || 'taller'}
        />
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-3">
          <p className="text-sm text-slate-300 font-semibold">Cliente no encontrado en este taller.</p>
          <p className="text-xs text-slate-500">Es posible que el cliente no tenga vehículos asignados actualmente.</p>
          <Link
            href={`/workshop/clients?tenantId=${activeTenantId}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
          >
            ← Volver al Directorio de Clientes
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = profile.phone ? profile.phone.replace(/\D/g, '') : null;

  return (
    <div className="space-y-6">
      <WorkshopNavigation
        tenantId={activeTenantId}
        totalVehicles={totalVehiclesCount}
        workshopSlug={tenantData?.slug || 'taller'}
      />

      {/* Back Link & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <Link
            href={`/workshop/clients?tenantId=${activeTenantId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition mb-1"
          >
            <span>← Volver a Clientes</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              {profile.name}
            </h1>
            {profile.identification && (
              <span className="rounded-md bg-slate-800 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300 border border-slate-700">
                C.I / RUC: {profile.identification}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            {profile.phone && (
              <span>📞 Tel: <strong className="text-slate-200">{profile.phone}</strong></span>
            )}
            {profile.email && (
              <span>✉️ Email: <strong className="text-slate-200">{profile.email}</strong></span>
            )}
          </div>
        </div>

        {/* Quick WhatsApp Action */}
        {cleanPhone && (
          <div className="flex items-center gap-2">
            <a
              href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                `Hola ${profile.name}, te saludamos de ${tenantData?.name || 'nuestro taller'}. ¿En qué podemos ayudarte hoy?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
            >
              <span>📲 Contactar por WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Commercial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Facturado</span>
          <p className="mt-1 font-mono text-xl font-black text-emerald-400">
            ${profile.totalSpent.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500">Historial acumulado</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Órdenes Realizadas</span>
          <p className="mt-1 text-xl font-black text-indigo-400">
            {profile.totalServices}
          </p>
          <span className="text-[10px] text-slate-500">Mantenimientos completados</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vehículos Asignados</span>
          <p className="mt-1 text-xl font-black text-slate-100">
            {profile.vehicles.length}
          </p>
          <span className="text-[10px] text-slate-500">{profile.vehicles.length > 1 ? 'Cliente con flota' : 'Vehículo único'}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Última Visita</span>
          <p className="mt-1 text-xs font-bold text-slate-200">
            {profile.lastVisitDate ? new Date(profile.lastVisitDate).toLocaleDateString('es-EC') : 'Sin visitas aún'}
          </p>
          <span className="text-[10px] text-slate-500">
            {profile.firstVisitDate ? `Primera: ${new Date(profile.firstVisitDate).toLocaleDateString('es-EC')}` : '—'}
          </span>
        </div>
      </div>

      {/* Portfolio de Vehículos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <span>🚗</span> Flota & Vehículos de {profile.name} ({profile.vehicles.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {profile.vehicles.map((veh) => (
            <div
              key={veh.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-black text-indigo-300 border border-slate-700">
                    {veh.plate}
                  </span>
                  <span className="text-xs font-bold text-slate-100">
                    {veh.brand} {veh.model}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {veh.current_mileage.toLocaleString()} km {veh.year ? `· Año ${veh.year}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <CopyButton
                  text={`https://januscore.pro/auto/${veh.plate}`}
                  label="Link"
                  copiedLabel="✓"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                />
                <a
                  href={`/auto/${veh.plate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-indigo-500/30 bg-indigo-600/10 px-2 py-1 text-[10px] font-bold text-indigo-400 hover:bg-indigo-600/20 transition"
                >
                  Ficha ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cronología de Órdenes de Trabajo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <span>📋</span> Cronología de Órdenes de Trabajo ({profile.workOrders.length})
          </h2>
          <span className="text-[11px] text-slate-400">Ordenadas de la más reciente a la más antigua</span>
        </div>

        {profile.workOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay órdenes de trabajo registradas para los vehículos de este cliente.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {profile.workOrders.map((order) => (
              <div key={order.id} className="py-4 space-y-2 hover:bg-slate-950/30 px-2 rounded-xl transition">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-indigo-300 border border-slate-700">
                      {order.vehiclePlate}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {order.vehicleBrand} {order.vehicleModel}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      · {order.mileage.toLocaleString()} km
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">
                      {new Date(order.serviceDate).toLocaleDateString('es-EC', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-400">
                      ${order.cost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-line pl-2 border-l-2 border-slate-700">
                  {order.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 pl-2">
                  {order.technicianName && (
                    <span>Técnico: <strong className="text-slate-300">{order.technicianName}</strong></span>
                  )}
                  {order.nextServiceMileage && (
                    <span>Próximo servicio: <strong className="text-indigo-300 font-mono">{order.nextServiceMileage.toLocaleString()} km</strong></span>
                  )}
                  {order.nextServiceDate && (
                    <span>Fecha sugerida: <strong className="text-indigo-300 font-mono">{order.nextServiceDate}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
