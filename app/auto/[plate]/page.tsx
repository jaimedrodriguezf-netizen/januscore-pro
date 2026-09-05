import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPlate, isServiceDue, getNextServicePlan } from '@/lib/mechanics/service';
import { MileageTrackerForm } from '@/components/mechanics/mileage-tracker-form';
import type { MaintenanceRecord, Vehicle } from '@/lib/mechanics/types';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export default async function VehiclePublicPage({
  params,
}: {
  params: Promise<{ plate: string }>;
}) {
  const { plate } = await params;
  const formattedPlate = formatPlate(plate || '');

  const supabase = await createSupabaseServerClient();

  // Query vehicle by plate (Case-insensitive) with tenant slug
  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select('*, tenants(slug)')
    .ilike('plate', formattedPlate)
    .maybeSingle();

  if (vehicleData?.tenants?.slug) {
    redirect(`/m/${vehicleData.tenants.slug}/${formattedPlate}`);
  }

  if (!vehicleData) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100 font-sans">
        <div className="mx-auto max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-3xl shadow-inner">
            🚗
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-100">Vehículo No Encontrado</h1>
          <p className="mt-2 text-xs text-slate-400">
            La placa <span className="font-mono font-bold text-indigo-400">{formattedPlate}</span> no registra mantenimientos en el sistema.
          </p>
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400">
            Si realizaste un servicio recientemente, solicita a tu taller o mecánico que registre tu vehículo para habilitar el seguimiento por QR.
          </div>
          <div className="mt-6">
            <Link
              href="/auto"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
            >
              ← Buscar otra placa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vehicle = vehicleData as Vehicle & { tenants?: { name: string } };

  // Fetch maintenance records
  const { data: recordsData } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .eq('status', 'completed')
    .order('service_date', { ascending: false });

  const records = (recordsData ?? []) as MaintenanceRecord[];
  const latestRecord = records[0];

  const hasNextService = latestRecord && (latestRecord.next_service_mileage || latestRecord.next_service_date);
  const due = latestRecord
    ? isServiceDue(vehicle.current_mileage, new Date(), {
        nextMileage: latestRecord.next_service_mileage,
        nextDate: latestRecord.next_service_date,
      })
    : false;

  const nextPlan = getNextServicePlan({
    nextMileage: latestRecord?.next_service_mileage,
    currentMileage: vehicle.current_mileage,
    nextDate: latestRecord?.next_service_date,
    brand: vehicle.brand,
    model: vehicle.model,
  });

  const serviceLabels: Record<string, string> = {
    oil_change: 'Cambio de Aceite y Filtros',
    brakes: 'Mantenimiento de Frenos',
    suspension: 'Suspensión y Dirección',
    full_abc: 'ABC de Motor y Mantenimiento Mayor',
    alignment_balancing: 'Alineación y Balanceo',
    general_repair: 'Reparación / Mantenimiento Especial',
  };

  // Server Action: Update vehicle odometer in real time
  async function updateMileageServerAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const vId = String(formData.get('vehicleId') || '');
    const p = String(formData.get('plate') || '');
    const m = Number(formData.get('mileage')) || 0;

    if (vId && m > 0) {
      await supabase
        .from('vehicles')
        .update({ current_mileage: m })
        .eq('id', vId);

      revalidatePath(`/auto/${p}`);
      revalidatePath('/workshop');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-16">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3.5 sticky top-0 z-20">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/auto" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
              J
            </span>
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-200">
              {vehicle.tenants?.name || 'JanusCore Auto'}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/auto"
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
            >
              🔍 Otra Placa
            </Link>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              QR Verificado ✓
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-6">
        {/* Vehicle Identity Card */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Placa Vehicular
              </span>
              <div className="mt-1 font-mono text-3xl font-black tracking-tight text-white">
                {vehicle.plate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-100">
                {vehicle.brand} {vehicle.model}
              </div>
              <div className="text-xs text-slate-400">
                {vehicle.year ? `Modelo ${vehicle.year}` : 'Automóvil'}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Último Km Registrado</span>
              <div className="text-lg font-bold text-indigo-400 font-mono">
                {vehicle.current_mileage.toLocaleString()} km
              </div>
            </div>
            {vehicle.owner_name && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">Propietario</span>
                <div className="text-xs font-semibold text-slate-300">
                  {vehicle.owner_name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Interactive Mileage Calculator & Mechanic Lead */}
        <MileageTrackerForm
          vehicleId={vehicle.id}
          plate={vehicle.plate}
          brand={vehicle.brand}
          model={vehicle.model}
          initialMileage={vehicle.current_mileage}
          nextMileageTarget={latestRecord?.next_service_mileage}
          onUpdateMileageAction={updateMileageServerAction}
        />

        {/* Maintenance History Timeline */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Historial de Servicios ({records.length})
              </h3>
              <p className="text-[11px] text-slate-400">Registro cronológico de mantenimientos asentados</p>
            </div>
            <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
              Más reciente primero
            </span>
          </div>

          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
                No hay registros de mantenimiento asentados aún.
              </div>
            ) : (
              records.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-md bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        {serviceLabels[r.service_type] || r.service_type}
                      </span>
                      <h4 className="mt-2 text-xs font-medium text-slate-200 leading-relaxed">
                        {r.description}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-100">
                        {r.mileage.toLocaleString()} km
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.service_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {r.technician_name && (
                    <div className="border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
                      <span>Taller / Mecánico: <strong className="text-slate-300">{r.technician_name}</strong></span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-[10px] text-slate-600">
          <p>Potenciado por <strong>januscore.pro</strong> — Sistema de Trazabilidad Automotriz & QR • <span className="font-mono">{APP_VERSION}</span></p>
        </footer>
      </main>
    </div>
  );
}
