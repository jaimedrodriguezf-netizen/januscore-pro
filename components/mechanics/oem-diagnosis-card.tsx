'use client';

import { useMemo } from 'react';
import { getNextServicePlan, type NextServicePlan } from '@/lib/mechanics/service';
import { transformOemPlanToWorkOrderItems } from '@/lib/mechanics/intake-flow';
import type { Vehicle } from '@/lib/mechanics/types';
import type { WorkOrderItem } from '@/lib/mechanics/work-order';

interface OemDiagnosisCardProps {
  vehicle: Vehicle;
  onApplyPlanToOrder: (items: WorkOrderItem[], notes?: string) => void;
  onProceedToOrder: () => void;
  onResetVehicle: () => void;
}

export function OemDiagnosisCard({
  vehicle,
  onApplyPlanToOrder,
  onProceedToOrder,
  onResetVehicle,
}: OemDiagnosisCardProps) {
  const plan: NextServicePlan = useMemo(() => {
    return getNextServicePlan({
      currentMileage: vehicle.current_mileage,
      brand: vehicle.brand,
      model: vehicle.model,
    });
  }, [vehicle.current_mileage, vehicle.brand, vehicle.model]);

  const handleApply = () => {
    const items = transformOemPlanToWorkOrderItems(plan);
    onApplyPlanToOrder(items, plan.recommendation);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-6 shadow-xl backdrop-blur-xs space-y-6">
      {/* Top Banner: Selected Vehicle Context & Change Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-lg">
            🚗
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-black text-indigo-300 border border-slate-700">
                {vehicle.plate}
              </span>
              <h2 className="text-sm font-bold text-slate-100">
                {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Odómetro registrado: <strong className="text-slate-200">{vehicle.current_mileage.toLocaleString()} km</strong>
              {vehicle.owner_name && (
                <> · Cliente: <span className="text-slate-300">{vehicle.owner_name}</span></>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetVehicle}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          <span>← Cambiar Vehículo</span>
        </button>
      </div>

      {/* OEM Factory Service Diagnosis Card */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Diagnóstico de Fábrica OEM
              </span>
              <h3 className="text-base font-extrabold text-slate-100">{plan.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              {plan.typeBadge}
            </span>
            {plan.isOverdue ? (
              <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 border border-rose-500/30 animate-pulse">
                ⚠️ Mantenimiento Vencido
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                Faltan {plan.remainingKm.toLocaleString()} km
              </span>
            )}
          </div>
        </div>

        {/* Fluid Specs */}
        {plan.fluidSpecs && plan.fluidSpecs.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <span>🛢️</span> Especificaciones de Fluidos Homologados:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              {plan.fluidSpecs.map((spec, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Operations Checklist */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
            <span>✅</span> Puntos de servicio sugeridos para este kilometraje:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plan.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation Note */}
        {plan.recommendation && (
          <p className="text-xs text-slate-400 italic bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
            💡 {plan.recommendation}
          </p>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onProceedToOrder}
          className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          Ir a Orden Manualmente ➡️
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition"
        >
          <span>🪄 Cargar Recomendaciones a la Orden</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
