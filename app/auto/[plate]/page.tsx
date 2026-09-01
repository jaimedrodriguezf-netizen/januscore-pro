import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPlate, isServiceDue } from '@/lib/mechanics/service';
import type { MaintenanceRecord, Vehicle } from '@/lib/mechanics/types';

export const dynamic = 'force-dynamic';

export default async function VehiclePublicPage({
  params,
}: {
  params: Promise<{ plate: string }>;
}) {
  const { plate } = await params;
  const formattedPlate = formatPlate(plate || '');

  const supabase = await createSupabaseServerClient();

  // Query vehicle by plate (Case-insensitive)
  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select('*')
    .ilike('plate', formattedPlate)
    .maybeSingle();

  if (!vehicleData) {
    return (
      <div className="min-h-screen bg-neutral-900 px-4 py-16 text-white">
        <div className="mx-auto max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800 text-2xl font-bold">
            🚗
          </div>
          <h1 className="mt-4 text-xl font-black">Vehículo No Encontrado</h1>
          <p className="mt-2 text-xs text-neutral-400">
            La placa <span className="font-mono font-bold text-white">{formattedPlate}</span> no registra mantenimientos en el sistema.
          </p>
          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-800/40 p-4 text-xs text-neutral-400">
            Si realizaste un servicio recientemente, solicita a tu mecánico que registre tu vehículo para habilitar el seguimiento por QR.
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

  const serviceLabels: Record<string, string> = {
    oil_change: 'Cambio de Aceite y Filtros',
    brakes: 'Mantenimiento de Frenos',
    suspension: 'Suspensión y Dirección',
    full_abc: 'ABC de Motor y Mantenimiento Mayor',
    alignment_balancing: 'Alineación y Balanceo',
    general_repair: 'Reparación General',
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased font-sans">
      {/* Header / Brand Banner */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
              J
            </span>
            <span className="text-xs font-extrabold tracking-wider uppercase text-neutral-300">
              {vehicle.tenants?.name || 'JanusCore Auto'}
            </span>
          </div>
          <span className="rounded-full bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            QR Verificado ✓
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Vehicle ID Card */}
        <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                Placa Vehicular
              </span>
              <div className="mt-1 font-mono text-3xl font-black tracking-tight text-white">
                {vehicle.plate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-neutral-200">
                {vehicle.brand} {vehicle.model}
              </div>
              <div className="text-xs text-neutral-500">
                {vehicle.year ? `Año ${vehicle.year}` : 'Automóvil'}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-neutral-800/80 pt-4">
            <div>
              <span className="text-[10px] uppercase text-neutral-500">Kilometraje Actual</span>
              <div className="text-lg font-bold text-neutral-200">
                {vehicle.current_mileage.toLocaleString()} km
              </div>
            </div>
            {vehicle.owner_name && (
              <div className="text-right">
                <span className="text-[10px] uppercase text-neutral-500">Propietario</span>
                <div className="text-xs font-semibold text-neutral-300">
                  {vehicle.owner_name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Service Alert Banner */}
        {hasNextService && (
          <div
            className={`mt-4 rounded-2xl border p-5 ${
              due
                ? 'border-rose-900/60 bg-rose-950/30 text-rose-200'
                : 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">{due ? '⚠️' : '🛡️'}</div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  {due ? 'Mantenimiento Requerido / Vencido' : 'Próximo Mantenimiento Programado'}
                </h2>
                <p className="mt-1 text-sm font-medium">
                  {latestRecord.next_service_mileage && (
                    <span>A los <strong className="text-white">{latestRecord.next_service_mileage.toLocaleString()} km</strong></span>
                  )}
                  {latestRecord.next_service_date && (
                    <span> o antes del <strong className="text-white">{new Date(latestRecord.next_service_date).toLocaleDateString()}</strong></span>
                  )}
                </p>
                <p className="mt-1 text-[11px] opacity-80">
                  {due
                    ? 'Tu vehículo ha alcanzado el kilometraje o fecha estimada. Te recomendamos agendar tu cita.'
                    : 'Tu vehículo se encuentra al día con sus servicios programados.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance History Timeline */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Historial de Servicios ({records.length})
            </h3>
            <span className="text-[10px] text-neutral-500">Orden cronológico</span>
          </div>

          <div className="mt-4 space-y-3">
            {records.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center text-xs text-neutral-500">
                No hay registros de mantenimiento asentados aún.
              </div>
            ) : (
              records.map((r, i) => (
                <div
                  key={r.id}
                  className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex rounded-md bg-indigo-950 border border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        {serviceLabels[r.service_type] || r.service_type}
                      </span>
                      <div className="mt-2 text-xs font-medium text-neutral-300">
                        {r.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-neutral-200">
                        {r.mileage.toLocaleString()} km
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(r.service_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {r.technician_name && (
                    <div className="mt-3 border-t border-neutral-800/60 pt-2 text-[10px] text-neutral-500">
                      Mecánico responsable: <span className="text-neutral-400 font-medium">{r.technician_name}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-[10px] text-neutral-600">
          <p>Potenciado por <strong>januscore.pro</strong> — Sistema de Trazabilidad Automotriz</p>
        </footer>
      </main>
    </div>
  );
}
