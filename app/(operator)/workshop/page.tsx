import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { formatPlate, calculateNextService } from '@/lib/mechanics/service';
import { generateVehicleQrDataUrl } from '@/lib/mechanics/qr-sticker';
import { formatWorkOrderDescription, type WorkOrderItem } from '@/lib/mechanics/work-order';
import { WorkOrderForm } from '@/components/mechanics/work-order-form';
import { TemplateExplorer } from '@/components/mechanics/template-explorer';
import { CopyButton } from '@/components/ui/copy-button';
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-400">No hay organizaciones o talleres asignados a este usuario.</p>
      </div>
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
      printStickerQr = await generateVehicleQrDataUrl('https://januscore.pro', v.plate);
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

  // Server Action: Save Full Work Order (Pilozo Vasco Form)
  async function saveWorkOrderAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const vehicleId = String(formData.get('vehicleId') || '');
    const orderNumber = String(formData.get('orderNumber') || '');
    const technicianName = String(formData.get('technicianName') || '');
    const serviceDate = String(formData.get('serviceDate') || new Date().toISOString());
    const mileage = Number(formData.get('mileage')) || 0;
    const cost = parseFloat(String(formData.get('cost') || '0')) || 0;
    const nextMileage = Number(formData.get('nextMileage')) || (mileage + 10000);
    const nextDate = String(formData.get('nextDate') || '');
    const recommendations = String(formData.get('recommendations') || '');

    let selectedOperations: string[] = [];
    try {
      selectedOperations = JSON.parse(String(formData.get('selectedOperations') || '[]'));
    } catch {}

    let items: WorkOrderItem[] = [];
    try {
      items = JSON.parse(String(formData.get('items') || '[]'));
    } catch {}

    const description = formatWorkOrderDescription({
      orderNumber,
      technicianName,
      selectedOperations,
      items,
      recommendations,
    });

    // 1. Insert maintenance record
    const { error: mErr } = await supabase.from('maintenance_records').insert({
      tenant_id: activeTenantId,
      vehicle_id: vehicleId,
      service_date: serviceDate,
      mileage,
      service_type: 'full_abc',
      description,
      technician_name: technicianName,
      cost,
      status: 'completed',
      next_service_mileage: nextMileage,
      next_service_date: nextDate || null,
    });

    if (mErr) {
      redirect(`/workshop?tenantId=${activeTenantId}&err=${encodeURIComponent(mErr.message)}`);
    }

    // 2. Update vehicle current mileage
    if (vehicleId && mileage > 0) {
      await supabase
        .from('vehicles')
        .update({ current_mileage: mileage })
        .eq('id', vehicleId);
    }

    revalidatePath('/workshop');
    redirect(`/workshop?tenantId=${activeTenantId}&print=${vehicleId}&ok=Orden%20de%20trabajo%20${orderNumber}%20guardada%20exitosamente`);
  }

  const totalVehicles = vehicles?.length ?? 0;
  const totalServices = vehicles?.reduce((acc, v) => acc + (v.maintenance_records?.length ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header & Quick Links Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Control de Taller & Flotas
          </span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-100">
            Módulo de Mecánica Automotriz
          </h1>
          <p className="text-xs text-slate-400">
            Registro de fichas técnicas, órdenes de servicio, proyección de mantenimientos y stickers QR
          </p>
        </div>

        {/* Public Portal & A4 Print Access */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/workshop/print-sheet?tenantId=${activeTenantId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/15 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600/25 hover:border-indigo-400 transition"
          >
            <span>🖨️ Plancha A4 (15 Stickers)</span>
          </Link>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2">
            <span className="text-sm">🌐</span>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Portal Público</span>
              <span className="font-mono text-xs font-semibold text-indigo-400">januscore.pro/auto</span>
            </div>
            <CopyButton
              text="https://januscore.pro/auto"
              label="Copiar"
              copiedLabel="✓"
              className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Vehículos</span>
            <p className="text-base font-extrabold text-slate-100">{totalVehicles}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Servicios</span>
            <p className="text-base font-extrabold text-indigo-400">{totalServices}</p>
          </div>
        </div>
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

      {/* Printable Sticker Banner with Direct Public Link */}
      {printVehicle && printStickerQr && (
        <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-6 shadow-xl backdrop-blur-xs">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <h2 className="text-sm font-bold text-indigo-300">
                Sticker QR & Enlace Público del Vehículo
              </h2>
            </div>
            <Link
              href={`/workshop?tenantId=${activeTenantId}`}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs"
            >
              ✕ Cerrar
            </Link>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            {/* Printable sticker box */}
            <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900 p-4 text-center shrink-0">
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                JanusCore Auto Service
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={printStickerQr}
                alt={`QR ${printVehicle.plate}`}
                className="mx-auto my-2 h-36 w-36 rounded-lg bg-white p-2"
              />
              <div className="font-mono text-lg font-black text-slate-100">
                {printVehicle.plate}
              </div>
              <div className="text-[10px] text-slate-400">
                Escanea para ver tu próximo mantenimiento
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {printVehicle.brand} {printVehicle.model} ({printVehicle.plate})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Imprime este sticker en papel adhesivo para colocarlo en el parabrisas. El cliente podrá consultar el historial de mantenimiento y las fechas de cambio de aceite escaneando el código o ingresando a su enlace público directo:
                </p>
              </div>

              {/* Direct Public Link Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">🔗 Enlace Público Directo:</span>
                  <span className="text-[11px] text-emerald-400 font-medium">Sin inicio de sesión</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://januscore.pro/auto/${printVehicle.plate}`}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-indigo-300 select-all focus:outline-hidden"
                  />
                  <CopyButton
                    text={`https://januscore.pro/auto/${printVehicle.plate}`}
                    label="Copiar Enlace"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/workshop/print-sheet?tenantId=${activeTenantId}&plate=${printVehicle.plate}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  <span>🖨️ Imprimir Plancha A4 (15)</span>
                </Link>
                <a
                  href={`/auto/${printVehicle.plate}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <span>Ver Ficha Técnica ↗</span>
                </a>
                {printVehicle.owner_phone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${printVehicle.owner_phone.replace(/\D/g, '')}&text=${encodeURIComponent(
                      `Hola ${printVehicle.owner_name || ''}, te compartimos el enlace para consultar la ficha de mantenimiento de tu vehículo (${printVehicle.plate}): https://januscore.pro/auto/${printVehicle.plate}`
                    )}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                  >
                    <span>📲 Enviar por WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Vehicle Form & Maintenance Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Register Vehicle Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">🚗</span>
            <h2 className="text-sm font-bold text-slate-100">1. Registrar Nuevo Vehículo</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Ingresa los datos técnicos del vehículo para generar su código QR único.
          </p>

          <form action={createVehicleAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Placa</label>
                <input
                  type="text"
                  name="plate"
                  placeholder="Ej. PBX-1234"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-mono font-bold uppercase text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Kilometraje Actual</label>
                <input
                  type="number"
                  name="mileage"
                  placeholder="Ej. 45000"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Marca</label>
                <input
                  type="text"
                  name="brand"
                  placeholder="Toyota"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Modelo</label>
                <input
                  type="text"
                  name="model"
                  placeholder="Corolla"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Año</label>
                <input
                  type="number"
                  name="year"
                  placeholder="2022"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Propietario</label>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="Juan Pérez"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Celular / WhatsApp</label>
                <input
                  type="text"
                  name="ownerPhone"
                  placeholder="0991234567"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              + Registrar Vehículo
            </button>
          </form>
        </div>

        {/* 2. Add Maintenance Service Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">🛠️</span>
            <h2 className="text-sm font-bold text-slate-100">2. Asentar Orden de Servicio / Mantenimiento</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Registra los trabajos realizados; el sistema calculará automáticamente la próxima fecha.
          </p>

          <form action={addMaintenanceAction} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300">Vehículo</label>
              <select
                name="vehicleId"
                required
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-hidden"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Tipo de Servicio</label>
                <select
                  name="serviceType"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-hidden"
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
                <label className="block text-[11px] font-medium text-slate-300">Kilometraje del Servicio</label>
                <input
                  type="number"
                  name="mileage"
                  placeholder="Ej. 45000"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300">Detalle de Trabajos & Repuestos</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Cambio de aceite sintético 10W-30 + filtro de aceite y filtro de aire."
                required
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Mecánico Responsable</label>
                <input
                  type="text"
                  name="technicianName"
                  placeholder="Carlos Mendoza"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Costo Total ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  placeholder="45.00"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              ✓ Guardar Mantenimiento & Generar Sticker
            </button>
          </form>
        </div>
      </div>

      {/* 3. Official Work Order Comprehensive Form (Pilozo Vasco Layout) */}
      <WorkOrderForm
        vehicles={vehicles || []}
        activeTenantId={activeTenantId}
        onSaveWorkOrderAction={saveWorkOrderAction}
      />

      {/* 4. OEM Master Catalog of 100+ Vehicles & Custom Template Creator */}
      <TemplateExplorer />

      {/* 5. Vehicles Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Vehículos en Taller ({totalVehicles})</h2>
            <p className="text-xs text-slate-400">Padrón vehicular registrado y accesos directos a enlaces públicos</p>
          </div>
          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="tenantId" value={activeTenantId} />
            <input
              type="text"
              name="q"
              defaultValue={params.q || ''}
              placeholder="Buscar por placa..."
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Placa</th>
                <th className="px-6 py-3.5">Vehículo</th>
                <th className="px-6 py-3.5">Km Actual</th>
                <th className="px-6 py-3.5">Propietario</th>
                <th className="px-6 py-3.5">Historial</th>
                <th className="px-6 py-3.5 text-right">Acciones & Enlaces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {!vehicles || vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No hay vehículos registrados en este taller.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-100">
                      {v.plate}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-indigo-400">
                      {v.current_mileage.toLocaleString()} km
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {v.owner_name || '—'} {v.owner_phone ? `(${v.owner_phone})` : ''}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                        {v.maintenance_records?.length ?? 0} servicios
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <CopyButton
                        text={`https://januscore.pro/auto/${v.plate}`}
                        label="Copiar Link"
                        copiedLabel="✓"
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      />
                      <Link
                        href={`/workshop?tenantId=${activeTenantId}&print=${v.id}`}
                        className="inline-flex items-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/20 transition"
                      >
                        🏷️ Sticker QR
                      </Link>
                      <a
                        href={`/auto/${v.plate}`}
                        target="_blank"
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        Ficha ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
