import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { formatPlate, calculateNextService } from '@/lib/mechanics/service';
import { generateVehicleQrDataUrl } from '@/lib/mechanics/qr-sticker';
import type { ServiceType } from '@/lib/mechanics/types';

export const dynamic = 'force-dynamic';

export default async function WorkshopAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; q?: string; print?: string; ok?: string; err?: string }>;
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
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-neutral-600">No hay talleres/tenants asignados.</p>
      </main>
    );
  }

  // Fetch vehicles in this tenant
  let vehicleQuery = supabase
    .from('vehicles')
    .select('*, maintenance_records(id, service_date, mileage, service_type, next_service_mileage, next_service_date)')
    .eq('tenant_id', activeTenantId)
    .order('updated_at', { ascending: false });

  if (params.q) {
    vehicleQuery = vehicleQuery.ilike('plate', `%${params.q.trim()}%`);
  }

  const { data: vehicles } = await vehicleQuery;

  // If printing a specific vehicle sticker
  let printStickerQr: string | null = null;
  let printVehicle = null;
  if (params.print) {
    const v = vehicles?.find((veh) => veh.id === params.print);
    if (v) {
      printVehicle = v;
      printStickerQr = await generateVehicleQrDataUrl('http://100.111.124.85:3000', v.plate);
    }
  }

  // Server Action: Register new vehicle
  async function createVehicleAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const rawPlate = String(formData.get('plate') || '');
    const brand = String(formData.get('brand') || '');
    const model = String(formData.get('model') || '');
    const year = Number(formData.get('year')) || undefined;
    const ownerName = String(formData.get('ownerName') || '');
    const ownerPhone = String(formData.get('ownerPhone') || '');
    const mileage = Number(formData.get('mileage')) || 0;

    const plate = formatPlate(rawPlate);

    if (!plate || !brand || !model) {
      redirect(`/workshop?tenantId=${activeTenantId}&err=Placa,%20marca%20y%20modelo%20son%20requeridos`);
    }

    const { error } = await supabase.from('vehicles').insert({
      tenant_id: activeTenantId,
      plate,
      brand,
      model,
      year,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      current_mileage: mileage,
    });

    if (error) {
      redirect(`/workshop?tenantId=${activeTenantId}&err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/workshop');
    redirect(`/workshop?tenantId=${activeTenantId}&ok=Vehículo%20${plate}%20registrado%20exitosamente`);
  }

  // Server Action: Add maintenance record
  async function addMaintenanceAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const vehicleId = String(formData.get('vehicleId') || '');
    const serviceType = String(formData.get('serviceType') || 'oil_change') as ServiceType;
    const mileage = Number(formData.get('mileage')) || 0;
    const description = String(formData.get('description') || '');
    const technicianName = String(formData.get('technicianName') || '');
    const cost = Number(formData.get('cost')) || undefined;

    if (!vehicleId || !description || mileage <= 0) {
      redirect(`/workshop?tenantId=${activeTenantId}&err=Complete%20todos%20los%20campos%20del%20servicio`);
    }

    const nextCalc = calculateNextService({
      serviceType,
      currentMileage: mileage,
      serviceDate: new Date(),
    });

    // 1. Insert maintenance record
    const { error: mError } = await supabase.from('maintenance_records').insert({
      tenant_id: activeTenantId,
      vehicle_id: vehicleId,
      service_date: new Date().toISOString(),
      mileage,
      service_type: serviceType,
      description,
      technician_name: technicianName,
      cost,
      status: 'completed',
      next_service_mileage: nextCalc.nextMileage,
      next_service_date: nextCalc.nextDate.toISOString().slice(0, 10),
    });

    if (mError) {
      redirect(`/workshop?tenantId=${activeTenantId}&err=${encodeURIComponent(mError.message)}`);
    }

    // 2. Update vehicle current_mileage
    await supabase
      .from('vehicles')
      .update({ current_mileage: mileage })
      .eq('id', vehicleId);

    revalidatePath('/workshop');
    redirect(`/workshop?tenantId=${activeTenantId}&print=${vehicleId}&ok=Mantenimiento%20registrado`);
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 text-neutral-900 dark:bg-black dark:text-neutral-100 font-sans">
      {/* Top Bar */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
              Módulo de Mecánica Automotriz
            </span>
            <h1 className="text-xl font-extrabold tracking-tight">Control de Taller & QR</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              ← Volver al Hub
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Notifications */}
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

        {/* Printable Sticker Modal (if print triggered) */}
        {printVehicle && printStickerQr && (
          <div className="mb-8 rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
              <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                🏷️ Sticker QR Listo para Imprimir (Parabrisas)
              </h2>
              <Link
                href={`/workshop?tenantId=${activeTenantId}`}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                ✕ Cerrar
              </Link>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
              {/* Actual printable sticker box */}
              <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-950">
                <div className="text-[10px] font-black tracking-wider uppercase text-neutral-500">
                  JanusCore Auto Service
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={printStickerQr}
                  alt={`QR ${printVehicle.plate}`}
                  className="mx-auto my-2 h-36 w-36 rounded-lg"
                />
                <div className="font-mono text-lg font-black text-neutral-900 dark:text-white">
                  {printVehicle.plate}
                </div>
                <div className="text-[10px] text-neutral-500">
                  Escaneá para ver tu próximo mantenimiento
                </div>
              </div>

              <div>
                <div className="text-sm font-bold">
                  {printVehicle.brand} {printVehicle.model} ({printVehicle.plate})
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Imprimí este sticker en papel adhesivo para colocarlo en el parabrisas del cliente. El cliente podrá escanearlo en cualquier momento sin necesidad de registrarse.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <a
                    href={`/auto/${printVehicle.plate}`}
                    target="_blank"
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                  >
                    Ver Ficha Pública →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forms Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Register Vehicle Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold">1. Registrar Nuevo Vehículo</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Ingresá los datos del auto para generar su código QR único.
            </p>

            <form action={createVehicleAction} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Placa</label>
                  <input
                    type="text"
                    name="plate"
                    placeholder="PBX-1234"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs uppercase font-mono font-bold dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Kilometraje Actual</label>
                  <input
                    type="number"
                    name="mileage"
                    placeholder="45000"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Marca</label>
                  <input
                    type="text"
                    name="brand"
                    placeholder="Toyota"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Modelo</label>
                  <input
                    type="text"
                    name="model"
                    placeholder="Corolla"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Año</label>
                  <input
                    type="number"
                    name="year"
                    placeholder="2022"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Propietario</label>
                  <input
                    type="text"
                    name="ownerName"
                    placeholder="Juan Pérez"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Celular / WhatsApp</label>
                  <input
                    type="text"
                    name="ownerPhone"
                    placeholder="0991234567"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-neutral-900 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                + Registrar Vehículo
              </button>
            </form>
          </div>

          {/* 2. Add Maintenance Service Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-bold">2. Asentar Servicio de Mantenimiento</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Registrá el trabajo realizado; el sistema proyectará el próximo servicio automáticamente.
            </p>

            <form action={addMaintenanceAction} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Vehículo</label>
                <select
                  name="vehicleId"
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 font-mono"
                >
                  {!vehicles || vehicles.length === 0 ? (
                    <option value="">No hay vehículos registrados</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.brand} {v.model} ({v.current_mileage.toLocaleString()} km)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Tipo de Servicio</label>
                  <select
                    name="serviceType"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <option value="oil_change">Cambio de Aceite (+5,000 km / 3m)</option>
                    <option value="brakes">Frenos (+10,000 km / 6m)</option>
                    <option value="full_abc">ABC de Motor Mayor (+10,000 km / 6m)</option>
                    <option value="suspension">Suspensión & Dirección (+10,000 km)</option>
                    <option value="alignment_balancing">Alineación & Balanceo (+5,000 km)</option>
                    <option value="general_repair">Reparación General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Kilometraje del Servicio</label>
                  <input
                    type="number"
                    name="mileage"
                    placeholder="45000"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Detalle de Trabajos & Repuestos</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Cambio de aceite sintético 10W-30 + filtro de aceite y filtro de aire."
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Mecánico Responsable</label>
                  <input
                    type="text"
                    name="technicianName"
                    placeholder="Carlos Mendoza"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Costo Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost"
                    placeholder="45.00"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                ✓ Guardar Mantenimiento & Generar Sticker
              </button>
            </form>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h2 className="text-sm font-bold">Vehículos en Taller ({vehicles?.length ?? 0})</h2>
            <form method="GET" className="flex items-center gap-2">
              <input type="hidden" name="tenantId" value={activeTenantId} />
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Buscar por placa..."
                className="rounded-lg border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                type="submit"
                className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-semibold hover:bg-neutral-200 dark:bg-neutral-800"
              >
                Buscar
              </button>
            </form>
          </div>

          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs dark:divide-neutral-800">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3">Placa</th>
                <th className="px-6 py-3">Vehículo</th>
                <th className="px-6 py-3">Km Actual</th>
                <th className="px-6 py-3">Propietario</th>
                <th className="px-6 py-3">Historial</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {!vehicles || vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                    No hay vehículos registrados en este taller.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-3 font-mono font-bold text-neutral-900 dark:text-white">
                      {v.plate}
                    </td>
                    <td className="px-6 py-3 text-neutral-600 dark:text-neutral-300">
                      {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                    </td>
                    <td className="px-6 py-3 font-mono font-medium text-neutral-700 dark:text-neutral-300">
                      {v.current_mileage.toLocaleString()} km
                    </td>
                    <td className="px-6 py-3 text-neutral-500">
                      {v.owner_name || '—'} {v.owner_phone ? `(${v.owner_phone})` : ''}
                    </td>
                    <td className="px-6 py-3 text-neutral-500">
                      {v.maintenance_records?.length ?? 0} servicios
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <Link
                        href={`/workshop?tenantId=${activeTenantId}&print=${v.id}`}
                        className="rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400"
                      >
                        🏷️ Sticker QR
                      </Link>
                      <a
                        href={`/auto/${v.plate}`}
                        target="_blank"
                        className="rounded bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        Ficha Pública ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
