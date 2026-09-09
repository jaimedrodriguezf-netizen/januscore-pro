'use client';

import { useState, useMemo } from 'react';
import type { Vehicle } from '@/lib/mechanics/types';
import { VehicleRegistrationForm } from '@/components/mechanics/vehicle-registration-form';

interface IntakeHeroSearchProps {
  vehicles: Vehicle[];
  activeTenantId: string;
  onSelectVehicle: (vehicle: Vehicle) => void;
  createVehicleAction: (formData: FormData) => Promise<void>;
}

export function IntakeHeroSearch({
  vehicles,
  activeTenantId,
  onSelectVehicle,
  createVehicleAction,
}: IntakeHeroSearchProps) {
  const [query, setQuery] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  // Filter vehicles by plate, owner name, owner id, or owner phone
  const filteredVehicles = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!q) return [];

    return vehicles.filter((v) => {
      const cleanPlate = (v.plate || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanOwner = (v.owner_name || '').toLowerCase();
      const cleanId = (v.owner_identification || '').toLowerCase();
      const cleanPhone = (v.owner_phone || '').replace(/[^0-9]/g, '');

      return (
        cleanPlate.includes(q) ||
        cleanOwner.includes(query.toLowerCase().trim()) ||
        cleanId.includes(q) ||
        cleanPhone.includes(q)
      );
    });
  }, [vehicles, query]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xs space-y-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Paso 1 · Recepción e Identificación
          </span>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-100">
            Recepción de Vehículo en Taller
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Busca por Placa, Cédula o Nombre para cargar el historial y recomendaciones del auto.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegistration(!showRegistration)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            showRegistration
              ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
          }`}
        >
          <span>{showRegistration ? '✕ Cancelar Registro' : '➕ Registrar Auto Nuevo'}</span>
        </button>
      </div>

      {/* Hero Search Bar */}
      {!showRegistration && (
        <div className="space-y-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ingresa Placa (ej. PBX-1234), Cédula o Nombre del Cliente..."
              autoFocus
              className="w-full rounded-xl border-2 border-indigo-500/40 bg-slate-950 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-100 placeholder-slate-500 shadow-inner focus:border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Quick Result Candidates */}
          {query.trim().length > 0 && (
            <div className="space-y-3">
              {filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredVehicles.slice(0, 6).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-indigo-500/50 hover:bg-slate-950 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-black text-indigo-300 border border-slate-700">
                            {v.plate}
                          </span>
                          <span className="text-xs font-bold text-slate-100">
                            {v.brand} {v.model}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {v.owner_name && <span>{v.owner_name}</span>}
                          {v.owner_identification && <span> · C.I: {v.owner_identification}</span>}
                        </div>
                        <div className="text-[10px] text-indigo-400 font-mono">
                          {v.current_mileage.toLocaleString()} km registrados
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectVehicle(v)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                      >
                        <span>Ingresar</span>
                        <span>➡️</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    No encontramos ningún vehículo registrado que coincida con <strong className="text-slate-200">"{query}"</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRegistration(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                  >
                    <span>➕ Registrar este Vehículo Ahora</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline Registration Form (Collapsible) */}
      {showRegistration && (
        <div className="border-t border-slate-800 pt-5">
          <VehicleRegistrationForm
            activeTenantId={activeTenantId}
            action={createVehicleAction}
          />
        </div>
      )}
    </div>
  );
}
