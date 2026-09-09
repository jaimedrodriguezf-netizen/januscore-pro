'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { searchCatalogVehicles, type CatalogVehicleItem } from '@/lib/mechanics/catalog-search';
import type { Vehicle } from '@/lib/mechanics/types';

interface VehicleRegistrationFormProps {
  activeTenantId: string;
  action: (formData: FormData) => Promise<void>;
}

export function VehicleRegistrationForm({
  activeTenantId,
  action,
}: VehicleRegistrationFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CatalogVehicleItem | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  // Form values
  const [plate, setPlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerIdentification, setOwnerIdentification] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Duplicate plate validation state
  const [plateStatus, setPlateStatus] = useState<'idle' | 'checking' | 'duplicate' | 'available'>('idle');
  const [duplicateVehicle, setDuplicateVehicle] = useState<Vehicle | null>(null);

  // Client identification lookup state
  const [idLookupStatus, setIdLookupStatus] = useState<'idle' | 'checking' | 'found_local' | 'found_sri' | 'not_found'>('idle');
  const [idLookupBadge, setIdLookupBadge] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtered results from search helper
  const searchResults = useMemo(() => {
    return searchCatalogVehicles(searchQuery, 8);
  }, [searchQuery]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time duplicate plate check
  useEffect(() => {
    const trimmedPlate = plate.trim();
    if (trimmedPlate.length < 3) {
      setPlateStatus('idle');
      setDuplicateVehicle(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPlateStatus('checking');
      try {
        const res = await fetch(
          `/api/workshop/lookup?tenantId=${activeTenantId}&type=plate&value=${encodeURIComponent(
            trimmedPlate
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.vehicle) {
            setPlateStatus('duplicate');
            setDuplicateVehicle(data.vehicle);
          } else {
            setPlateStatus('available');
            setDuplicateVehicle(null);
          }
        }
      } catch {
        setPlateStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [plate, activeTenantId]);

  // Real-time client identification lookup (Cédula 10 digits or RUC 13 digits)
  useEffect(() => {
    const cleaned = ownerIdentification.trim().replace(/\D/g, '');
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      setIdLookupStatus('idle');
      setIdLookupBadge(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIdLookupStatus('checking');
      try {
        const res = await fetch(
          `/api/workshop/lookup?tenantId=${activeTenantId}&type=identification&value=${cleaned}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.client) {
            if (data.source === 'local') {
              setIdLookupStatus('found_local');
              const vehCount = data.vehicles?.length || 1;
              setIdLookupBadge(
                `✓ Cliente del taller (${vehCount} vehículo${vehCount > 1 ? 's' : ''})`
              );
            } else {
              setIdLookupStatus('found_sri');
              setIdLookupBadge('✓ Verificado SRI (CipherByte)');
            }

            if (data.client.name && !ownerName) {
              setOwnerName(data.client.name);
            }
            if (data.client.phone && !ownerPhone) {
              setOwnerPhone(data.client.phone);
            }
            if (data.client.email && !ownerEmail) {
              setOwnerEmail(data.client.email);
            }
          } else {
            setIdLookupStatus('not_found');
            setIdLookupBadge(null);
          }
        }
      } catch {
        setIdLookupStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [ownerIdentification, activeTenantId, ownerName, ownerPhone, ownerEmail]);

  const handleSelectTemplate = (item: CatalogVehicleItem) => {
    setSelectedTemplate(item);
    setBrand(item.brand);
    setModel(item.model);

    // If generationYears has format "2021-2026", suggest the current year or starting year
    if (item.generationYears) {
      const match = item.generationYears.match(/\b(19\d\d|20\d\d)\b/);
      if (match) {
        setYear(match[1]);
      }
    }

    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    setSelectedTemplate(null);
    setBrand('');
    setModel('');
    setYear('');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🚗</span>
          <h2 className="text-sm font-bold text-slate-100">1. Registrar Nuevo Vehículo</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsManualMode(!isManualMode);
            if (!isManualMode) handleClearSelection();
          }}
          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2"
        >
          {isManualMode ? '🔍 Usar Buscador de Fichas' : '✏️ Ingreso Manual Libre'}
        </button>
      </div>

      <p className="mt-1 text-xs text-slate-400">
        {isManualMode
          ? 'Ingreso manual libre sin vincular al catálogo de fichas OEM.'
          : 'Busca el modelo en las fichas para autocompletar marca, modelo y especificaciones.'}
      </p>

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="tenantId" value={activeTenantId} />

        {/* 1. Predictive Search Combobox (When not in manual mode) */}
        {!isManualMode && (
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Buscar en Fichas Existentes (Marca o Modelo)
            </label>

            {!selectedTemplate ? (
              <div ref={dropdownRef} className="relative">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Escribe para buscar: ej. Hilux, Aveo, D-Max, Sportage, Yaris..."
                    className="w-full rounded-xl border border-indigo-500/30 bg-slate-950/80 pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden transition"
                  />
                </div>

                {/* Dropdown Suggestions */}
                {isDropdownOpen && searchQuery.trim().length > 0 && (
                  <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No se encontró ficha para &quot;{searchQuery}&quot;.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualMode(true);
                            setBrand(searchQuery);
                          }}
                          className="text-indigo-400 hover:underline font-semibold"
                        >
                          ¿Ingresar manualmente?
                        </button>
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTemplate(item)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-slate-800 transition border-b border-slate-800/60 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                              {item.brand}
                            </span>
                            <span className="font-semibold text-slate-200">
                              {item.model}
                            </span>
                            {item.generationYears && (
                              <span className="text-[10px] text-slate-400">
                                ({item.generationYears})
                              </span>
                            )}
                          </div>
                          {item.engineDisplacement && (
                            <span className="text-[10px] font-mono text-cyan-400">
                              {item.engineDisplacement}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Template Card */
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-base">✓</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {selectedTemplate.brand}
                      </span>
                      <span className="text-xs font-bold text-slate-100">
                        {selectedTemplate.model}
                      </span>
                      {selectedTemplate.generationYears && (
                        <span className="text-[10px] text-slate-400">
                          ({selectedTemplate.generationYears})
                        </span>
                      )}
                    </div>
                    {selectedTemplate.engineDisplacement && (
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Motor: {selectedTemplate.engineDisplacement}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Placa y Kilometraje Actual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-medium text-slate-300">
                Placa <span className="text-rose-400">*</span>
              </label>
              {plateStatus === 'checking' && (
                <span className="text-[10px] text-indigo-400 animate-pulse font-medium">Verificando...</span>
              )}
              {plateStatus === 'available' && (
                <span className="text-[10px] text-emerald-400 font-semibold">✓ Placa disponible</span>
              )}
              {plateStatus === 'duplicate' && (
                <span className="text-[10px] text-rose-400 font-bold">⚠️ Ya registrada</span>
              )}
            </div>
            <input
              type="text"
              name="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="PBA-1234"
              required
              className={`mt-1 w-full font-mono rounded-lg border px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden transition ${
                plateStatus === 'duplicate'
                  ? 'border-rose-500 bg-rose-950/30 focus:border-rose-500'
                  : 'border-slate-700 bg-slate-800/80 focus:border-indigo-500'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Kilometraje Actual
            </label>
            <input
              type="number"
              name="mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="54200"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Duplicate Vehicle Alert Banner */}
        {plateStatus === 'duplicate' && duplicateVehicle && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div>
                <p className="font-bold text-slate-100">
                  El vehículo con placa {duplicateVehicle.plate} ya está registrado en tu taller
                </p>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  {duplicateVehicle.brand} {duplicateVehicle.model} {duplicateVehicle.year ? `(${duplicateVehicle.year})` : ''} • Propietario: {duplicateVehicle.owner_name || 'Sin nombre'} • {duplicateVehicle.current_mileage.toLocaleString()} km
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/auto/${duplicateVehicle.plate}`}
                target="_blank"
                className="rounded-lg border border-rose-500/40 bg-rose-900/40 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-800/60 transition"
              >
                Ver Ficha ↗
              </a>
            </div>
          </div>
        )}

        {/* 3. Marca, Modelo y Año */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Marca <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="ej. Toyota"
              required
              readOnly={!isManualMode && selectedTemplate !== null}
              className={`mt-1 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden ${
                !isManualMode && selectedTemplate
                  ? 'bg-slate-800/40 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-800/80'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Modelo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ej. Corolla"
              required
              readOnly={!isManualMode && selectedTemplate !== null}
              className={`mt-1 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden ${
                !isManualMode && selectedTemplate
                  ? 'bg-slate-800/40 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-800/80'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Año
            </label>
            <input
              type="number"
              name="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2022"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 4. Propietario / Cliente (Cédula o RUC, Nombre, Teléfono, Correo) */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-300">
                  Cédula o RUC del Cliente
                </label>
                {idLookupStatus === 'checking' && (
                  <span className="text-[10px] text-indigo-400 animate-pulse font-medium">Buscando...</span>
                )}
                {idLookupBadge && (
                  <span className="text-[10px] text-emerald-400 font-semibold">{idLookupBadge}</span>
                )}
              </div>
              <input
                type="text"
                name="ownerIdentification"
                value={ownerIdentification}
                onChange={(e) => setOwnerIdentification(e.target.value)}
                placeholder="Ej. 1719623512"
                className="mt-1 w-full font-mono rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Propietario / Cliente
              </label>
              <input
                type="text"
                name="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Juan Pérez o Razón Social"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                WhatsApp / Celular
              </label>
              <input
                type="text"
                name="ownerPhone"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="0991234567"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="cliente@correo.com"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={plateStatus === 'duplicate'}
          className={`mt-2 w-full rounded-lg py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-[0.99] ${
            plateStatus === 'duplicate'
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {plateStatus === 'duplicate' ? '⚠️ Placa ya registrada (No se permite duplicar)' : '+ Registrar Vehículo'}
        </button>
      </form>
    </div>
  );
}
