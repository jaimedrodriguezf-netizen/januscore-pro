'use client';

import { useState, useTransition } from 'react';
import { getNextServicePlan, type NextServicePlan } from '@/lib/mechanics/service';

interface MileageTrackerFormProps {
  vehicleId: string;
  plate: string;
  brand?: string;
  model?: string;
  initialMileage: number;
  nextMileageTarget?: number;
  onUpdateMileageAction: (formData: FormData) => Promise<void>;
}

export function MileageTrackerForm({
  vehicleId,
  plate,
  brand,
  model,
  initialMileage,
  nextMileageTarget,
  onUpdateMileageAction,
}: MileageTrackerFormProps) {
  const [mileage, setMileage] = useState<number>(initialMileage);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculate live plan based on typed mileage
  const liveTarget = nextMileageTarget || Math.ceil((mileage + 1) / 10000) * 10000;
  const plan: NextServicePlan = getNextServicePlan({
    nextMileage: liveTarget,
    currentMileage: mileage,
    brand,
    model,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavedSuccess(false);

    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('plate', plate);
    formData.append('mileage', String(mileage));

    startTransition(async () => {
      await onUpdateMileageAction(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    });
  }

  return (
    <div className="rounded-3xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <span className="rounded bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Diagnóstico en Tiempo Real
            </span>
          </div>
          <h2 className="mt-1 text-base font-extrabold text-white">
            Actualizar Kilometraje del Tablero
          </h2>
          <p className="text-xs text-slate-400">
            Ingresa el kilometraje actual de tu odómetro para ver exactamente qué le toca a tu auto
          </p>
        </div>

        {savedSuccess && (
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300 animate-pulse">
            ✓ ¡Kilometraje Guardado!
          </span>
        )}
      </div>

      {/* Mileage Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Kilometraje Actual (km)
          </label>
          <div className="mt-1.5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                name="mileage"
                required
                min={1}
                value={mileage || ''}
                onChange={(e) => setMileage(Number(e.target.value) || 0)}
                placeholder="Ej. 82500"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xl font-black text-indigo-300 focus:border-indigo-500 focus:outline-hidden"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500 uppercase">
                KM
              </span>
            </div>

            <button
              type="submit"
              disabled={isPending || mileage <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition shrink-0"
            >
              <span>{isPending ? 'Guardando...' : '💾 Guardar para el Taller'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Dynamic Results Card */}
      {mileage > 0 && (
        <div className="mt-4 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Diagnóstico Calculado
              </span>
              <h3 className="text-sm font-bold text-white">
                {plan.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                plan.isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {plan.isOverdue ? '⚠️ Servicio Vencido / Requerido' : `✓ Faltan ~${plan.remainingKm.toLocaleString()} km`}
              </span>
            </div>
          </div>

          {/* Checklist of recommended items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              📋 Lista de Trabajos & Repuestos Recomendados:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {plan.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fluids / Specs */}
          {plan.fluidSpecs.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Especificaciones Recomendadas:</span>
              {plan.fluidSpecs.map((spec, i) => (
                <p key={i} className="text-[11px] text-slate-300">• {spec}</p>
              ))}
            </div>
          )}

          {/* WhatsApp CTA */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              {plan.recommendation}
            </p>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Hola, acabo de actualizar el odómetro de mi vehículo (${plate} - ${brand || ''} ${model || ''}) a ${mileage.toLocaleString()} km y deseo cotizar/agendar el "${plan.title}".`
              )}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition shrink-0"
            >
              <span>📲 Cotizar este Servicio por WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
