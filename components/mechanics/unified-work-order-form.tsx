'use client';

import { useState } from 'react';
import type { Vehicle } from '@/lib/mechanics/types';
import type { WorkOrderItem } from '@/lib/mechanics/work-order';
import { WorkOrderForm } from '@/components/mechanics/work-order-form';
import { prepareExpressWorkOrderPayload } from '@/lib/mechanics/intake-flow';

interface UnifiedWorkOrderFormProps {
  vehicles: Vehicle[];
  activeTenantId?: string;
  selectedVehicle?: Vehicle | null;
  initialItems?: WorkOrderItem[];
  initialRecommendations?: string;
  onSaveWorkOrderAction: (formData: FormData) => Promise<void>;
  onBackToDiagnosis?: () => void;
}

export function UnifiedWorkOrderForm({
  vehicles,
  activeTenantId,
  selectedVehicle,
  initialItems = [],
  initialRecommendations = '',
  onSaveWorkOrderAction,
  onBackToDiagnosis,
}: UnifiedWorkOrderFormProps) {
  const [mode, setMode] = useState<'express' | 'full'>('express');
  const [vehicleId, setVehicleId] = useState<string>(selectedVehicle?.id || vehicles[0]?.id || '');
  const [orderNumber, setOrderNumber] = useState<string>(
    `OT-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [technicianName, setTechnicianName] = useState<string>('Fabricio Pilozo');
  const [mileage, setMileage] = useState<number>(selectedVehicle?.current_mileage || 0);
  const [items, setItems] = useState<WorkOrderItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          { name: 'Cambio de aceite de motor sintético', spec: '5W-30 dexos1 Gen3', cost: 45.0 },
          { name: 'Filtro de aceite de motor', spec: 'Genuino', cost: 8.0 },
          { name: 'Mano de obra y revisión de niveles', spec: 'Mano de obra técnica', cost: 12.0 },
        ]
  );
  const [recommendations, setRecommendations] = useState<string>(initialRecommendations);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentVehicle = vehicles.find((v) => v.id === vehicleId) || selectedVehicle;
  const totalCost = items.reduce((acc, item) => acc + (Number(item.cost) || 0), 0);

  function handleAddItem() {
    setItems((prev) => [...prev, { name: '', spec: '', cost: 0 }]);
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: keyof WorkOrderItem, value: string | number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleExpressSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vehicleId) return;

    setIsSubmitting(true);
    try {
      const payload = prepareExpressWorkOrderPayload({
        vehicleId,
        technicianName,
        orderNumber,
        mileage: Number(mileage) || 0,
        items,
        recommendations,
      });

      const formData = new FormData();
      formData.append('vehicleId', payload.vehicleId);
      if (activeTenantId) formData.append('tenantId', activeTenantId);
      formData.append('orderNumber', payload.orderNumber);
      formData.append('technicianName', payload.technicianName);
      formData.append('serviceDate', payload.serviceDate);
      formData.append('mileage', String(payload.mileage));
      formData.append('cost', String(payload.cost));
      formData.append('nextMileage', String(payload.nextMileage));
      formData.append('nextDate', payload.nextDate);
      formData.append('selectedOperations', JSON.stringify(payload.selectedOperations));
      formData.append('items', JSON.stringify(payload.items));
      formData.append('recommendations', payload.recommendations);

      await onSaveWorkOrderAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center gap-3">
          {onBackToDiagnosis && (
            <button
              type="button"
              onClick={onBackToDiagnosis}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              ← Diagnóstico OEM
            </button>
          )}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Paso 3 · Asentar Orden de Trabajo
            </span>
            <h2 className="text-sm font-bold text-slate-100">
              {mode === 'express' ? '⚡ Orden de Trabajo Modo Express' : '📋 Orden Completa Oficial (Pilozo Vasco)'}
            </h2>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('express')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              mode === 'express'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡ Modo Express</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              mode === 'full'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋 Modo Completo 360°</span>
          </button>
        </div>
      </div>

      {mode === 'full' ? (
        <WorkOrderForm
          vehicles={vehicles}
          activeTenantId={activeTenantId}
          onSaveWorkOrderAction={onSaveWorkOrderAction}
        />
      ) : (
        /* Express Mode Form */
        <form onSubmit={handleExpressSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-5 shadow-sm">
            {/* Context Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 font-bold">
                  ⚡
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Vehículo en Recepción
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300">
                      {currentVehicle?.plate || 'Sin Placa'}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {currentVehicle?.brand} {currentVehicle?.model}
                    </span>
                  </div>
                </div>
              </div>

              <div className="font-mono text-xs font-bold text-slate-400">
                ORDEN N° {orderNumber}
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">N° de Orden</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Técnico Responsable</label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="Ej. Fabricio Pilozo"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Kilometraje Actual (km)</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Items & Parts Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Repuestos, Lubricantes & Mano de Obra
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <span>+ Agregar Línea</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Descripción del trabajo o repuesto"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      required
                      className="w-full sm:flex-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="Especificación técnica (ej. 5W-30 dexos1)"
                      value={item.spec || ''}
                      onChange={(e) => handleItemChange(index, 'spec', e.target.value)}
                      className="w-full sm:flex-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-28">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.cost || ''}
                          onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-6 pr-2.5 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Summary */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total a Facturar: </span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Observaciones / Recomendaciones para el Cliente
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Observaciones de entrega o próximos servicios recomendados..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <span>✓ Asentar Orden Express & Finalizar Ingreso</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
