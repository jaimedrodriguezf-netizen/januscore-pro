'use client';

import { useState } from 'react';
import {
  WORKSHOP_OPERATIONS_CATALOG,
  RECEPTION_INVENTORY_ITEMS,
  calculateWorkOrderTotals,
  type WorkOrderItem,
} from '@/lib/mechanics/work-order';
import type { Vehicle } from '@/lib/mechanics/types';

interface WorkOrderFormProps {
  vehicles: Vehicle[];
  activeTenantId?: string;
  onSaveWorkOrderAction: (formData: FormData) => Promise<void>;
}

export function WorkOrderForm({
  vehicles,
  activeTenantId,
  onSaveWorkOrderAction,
}: WorkOrderFormProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [orderNumber, setOrderNumber] = useState<string>('01127');
  const [technicianName, setTechnicianName] = useState<string>('Fabricio Pilozo');
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState<number>(vehicles[0]?.current_mileage || 60036);
  const [fuelLevel, setFuelLevel] = useState<string>('1/2');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia Bancaria');

  // Selected operations checklist
  const [selectedOps, setSelectedOps] = useState<string[]>([
    'Cambio de aceite de motor',
    'Cambio de filtro de aire',
    'Cambio de filtro de cabina (A/C)',
    'Cambio de filtro de combustible',
    'Revisión / Cambio de bujías de encendido',
    'Cambio de propulsores / supresores de bobinas',
    'Diagnóstico computarizado (Scanner OBD2)',
  ]);

  // Inventory checklist
  const [inventory, setInventory] = useState<Record<string, boolean>>({
    matricula: true,
    radio: true,
    moquetas: true,
    llantaEmergencia: true,
    gata: true,
    palanca: true,
    llaveRueda: true,
    extintor: true,
    tapaGasolina: true,
  });

  // Dynamic parts & labor items
  const [items, setItems] = useState<WorkOrderItem[]>([
    { name: 'Cambio de aceite de motor', spec: 'PETRONAS 5W30 DEXOS 1 GEN 3', cost: 50.0 },
    { name: 'Bujías de iridio', spec: 'IRIDIO DENSO IXU22', cost: 47.0 },
    { name: 'Filtro de aire de motor', spec: 'Genuino', cost: 8.25 },
    { name: 'Filtro de aire acondicionado (cabina)', spec: 'Genuino con carbón', cost: 7.0 },
    { name: 'Filtro de combustible', spec: 'Genuino', cost: 7.0 },
    { name: 'Supresores de bobina (2)', spec: 'Genuino', cost: 30.0 },
    { name: 'Mano de obra y diagnóstico computarizado', spec: 'Mano de obra certificada', cost: 11.75 },
  ]);

  const [recommendations, setRecommendations] = useState<string>(
    '• Se recomienda realizar reajuste de suspensión y revisión de fluidos (refrigerante, líquido de frenos y líquido de dirección)\n• Se recomienda cambiar filtros (aire, cabina y combustible)\n• Se recomienda limpiar inyectores mediante ultrasonido\n• Se recomienda realizar un ABC de frenos'
  );
  const [nextMileage, setNextMileage] = useState<number>(70000);
  const [nextDate, setNextDate] = useState<string>('2026-03-15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const totals = calculateWorkOrderTotals(items);

  function toggleOperation(op: string) {
    setSelectedOps((prev) =>
      prev.includes(op) ? prev.filter((o) => o !== op) : [...prev, op]
    );
  }

  function toggleInventory(id: string) {
    setInventory((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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

  function loadGrooveTemplate() {
    setOrderNumber('01127');
    setTechnicianName('Fabricio Pilozo');
    setMileage(60036);
    setSelectedOps([
      'Cambio de aceite de motor',
      'Cambio de filtro de aire',
      'Cambio de filtro de cabina (A/C)',
      'Cambio de filtro de combustible',
      'Revisión / Cambio de bujías de encendido',
      'Cambio de propulsores / supresores de bobinas',
      'Diagnóstico computarizado (Scanner OBD2)',
    ]);
    setItems([
      { name: 'Cambio de aceite de motor', spec: 'PETRONAS 5W30 DEXOS 1 GEN 3', cost: 50.0 },
      { name: 'Bujías de iridio', spec: 'IRIDIO DENSO IXU22', cost: 47.0 },
      { name: 'Filtro de aire de motor', spec: 'Genuino', cost: 8.25 },
      { name: 'Filtro de aire acondicionado (cabina)', spec: 'Genuino con carbón', cost: 7.0 },
      { name: 'Filtro de combustible', spec: 'Genuino', cost: 7.0 },
      { name: 'Supresores de bobina (2)', spec: 'Genuino', cost: 30.0 },
      { name: 'Mano de obra y diagnóstico computarizado', spec: 'Mano de obra certificada', cost: 11.75 },
    ]);
    setNextMileage(70000);
    setPaymentMethod('Transferencia Bancaria');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('vehicleId', selectedVehicleId);
    if (activeTenantId) formData.append('tenantId', activeTenantId);
    formData.append('orderNumber', orderNumber);
    formData.append('technicianName', technicianName);
    formData.append('serviceDate', serviceDate);
    formData.append('mileage', String(mileage));
    formData.append('fuelLevel', fuelLevel);
    formData.append('paymentMethod', paymentMethod);
    formData.append('serviceType', 'full_abc');
    formData.append('cost', String(totals.total));
    formData.append('selectedOperations', JSON.stringify(selectedOps));
    formData.append('items', JSON.stringify(items));
    formData.append('recommendations', recommendations);
    formData.append('nextMileage', String(nextMileage));
    formData.append('nextDate', nextDate);

    try {
      await onSaveWorkOrderAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Controls & Template Loader */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-4 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <div>
            <h2 className="text-sm font-bold text-white">
              Orden de Trabajo y Hoja de Mantenimiento Integral
            </h2>
            <p className="text-xs text-slate-400">
              Formulario técnico oficial para recepción, operaciones, repuestos y entrega
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadGrooveTemplate}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition shrink-0"
        >
          <span>🪄 Cargar Plantilla Oficial (Chevrolet Groove 60k)</span>
        </button>
      </div>

      {/* 1. Reception & Vehicle Information */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <span>1.</span> Datos de Recepción & Vehículo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300">N° de Orden de Trabajo</label>
            <input
              type="text"
              name="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              placeholder="01127"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 font-mono text-sm font-bold text-indigo-300 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">Asesor de Servicio / Técnico</label>
            <input
              type="text"
              name="technicianName"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              required
              placeholder="Fabricio Pilozo"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">Fecha del Servicio</label>
            <input
              type="date"
              name="serviceDate"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[11px] font-medium text-slate-300">Seleccionar Vehículo</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                const found = vehicles.find((v) => v.id === e.target.value);
                if (found) setMileage(found.current_mileage);
              }}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.brand} {v.model} ({v.owner_name || 'Sin titular'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">Kilometraje de Ingreso (Odómetro)</label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value) || 0)}
              required
              placeholder="60036"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 font-mono text-sm font-bold text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">Nivel de Combustible</label>
            <div className="mt-1 flex items-center gap-1.5">
              {['E', '1/4', '1/2', '3/4', 'F'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFuelLevel(lvl)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-mono font-bold transition ${
                    fuelLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'border border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Vehicle Reception Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <span>2.</span> Inventario de Recepción del Vehículo
          </h3>
          <span className="text-[11px] text-slate-400">Toca para marcar elementos presentes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {RECEPTION_INVENTORY_ITEMS.map((item) => {
            const isPresent = !!inventory[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleInventory(item.id)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                  isPresent
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-500'
                }`}
              >
                <span className="truncate">{item.label}</span>
                <span className="text-xs">{isPresent ? '✓' : '—'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Operations Matrix by Category */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <span>3.</span> Matriz de Operaciones y Servicios Realizados
          </h3>
          <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
            {selectedOps.length} Seleccionados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(WORKSHOP_OPERATIONS_CATALOG).map(([categoryKey, operations]) => {
            const titles: Record<string, string> = {
              motor: '⚙️ Motor',
              frenos: '🛑 Frenos',
              cajaTransmision: '🔄 Caja & Transmisión',
              suspensionDireccion: '🚗 Suspensión & Dirección',
              ruedas: '🛞 Ruedas & Llantas',
              sistemaElectrico: '⚡ Sistema Eléctrico & Escáner',
            };

            return (
              <div
                key={categoryKey}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5"
              >
                <h4 className="text-xs font-extrabold text-slate-200 border-b border-slate-800/80 pb-1.5">
                  {titles[categoryKey] || categoryKey}
                </h4>
                <div className="space-y-1.5">
                  {operations.map((op) => {
                    const isChecked = selectedOps.includes(op);
                    return (
                      <label
                        key={op}
                        className={`flex items-start gap-2 rounded-lg p-1.5 text-xs transition cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600/15 text-indigo-200 font-medium'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOperation(op)}
                          className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                        />
                        <span className="leading-tight">{op}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Parts, Fluids & Labor Items Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <span>4.</span> Desglose de Repuestos, Fluidos & Mano de Obra
            </h3>
            <p className="text-[11px] text-slate-400">Especifica marcas, viscosidades y costos facturados</p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition"
          >
            <span>+ Agregar Fila</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Descripción del ítem / servicio (ej. Cambio de aceite)"
                  value={it.name}
                  onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Especificación técnica (ej. PETRONAS 5W30 DEXOS 1 GEN 3)"
                  value={it.spec || ''}
                  onChange={(e) => handleItemChange(idx, 'spec', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-indigo-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="w-28 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={it.cost || ''}
                  onChange={(e) => handleItemChange(idx, 'cost', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-6 pr-2 py-1.5 font-mono text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden text-right"
                />
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">$</span>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="text-slate-500 hover:text-rose-400 p-1 text-xs"
                title="Eliminar fila"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Totals & Payment Method */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Método de Pago:</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta de Crédito/Débito">Tarjeta de Crédito / Débito</option>
              <option value="Crédito Taller">Crédito Taller</option>
            </select>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">TOTAL FACTURADO:</span>
            <span className="ml-3 font-mono text-2xl font-black text-emerald-400">
              ${totals.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Next Maintenance & Recommendations */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <span>5.</span> Próximo Mantenimiento Programado & Recomendaciones Técnicas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300">Próximo Kilometraje Sugerido</label>
            <input
              type="number"
              value={nextMileage}
              onChange={(e) => setNextMileage(Number(e.target.value) || 0)}
              required
              placeholder="70000"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 font-mono text-sm font-bold text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">Fecha Estimada Límite</label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300">
            Recomendaciones Técnicas del Asesor / Taller
          </label>
          <textarea
            rows={4}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="Recomendaciones para el cliente..."
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 transition cursor-pointer"
        >
          <span>{isSubmitting ? 'Guardando en Base de Datos...' : '💾 Guardar Orden de Trabajo y Sincronizar Ficha QR →'}</span>
        </button>
      </div>
    </form>
  );
}
