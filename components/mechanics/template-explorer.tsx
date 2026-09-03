'use client';

import { useState, useMemo } from 'react';
import {
  type MaintenanceTemplate,
  type MaintenanceIntervalStep,
} from '@/lib/mechanics/maintenance-templates';
import { mergeCustomTemplatesWithMaster } from '@/lib/mechanics/template-service';
import { TemplateCreatorForm } from './template-creator-form';

interface TemplateExplorerProps {
  onSelectTemplateForWorkOrder?: (template: MaintenanceTemplate) => void;
}

export function TemplateExplorer({
  onSelectTemplateForWorkOrder,
}: TemplateExplorerProps) {
  const [customTemplates, setCustomTemplates] = useState<MaintenanceTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedFuel, setSelectedFuel] = useState<string>('all');
  const [activeModalTemplate, setActiveModalTemplate] = useState<MaintenanceTemplate | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const allTemplates = useMemo(() => {
    return mergeCustomTemplatesWithMaster(customTemplates);
  }, [customTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch =
        !searchTerm.trim() ||
        t.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.engineDisplacement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.engineOil.viscosity.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand =
        selectedBrand === 'all' ||
        (selectedBrand === 'chinas'
          ? ['Chery', 'Great Wall', 'JAC', 'Jetour', 'Geely', 'BYD', 'Changan'].includes(t.brand)
          : t.brand.toLowerCase() === selectedBrand.toLowerCase());

      const matchesFuel = selectedFuel === 'all' || t.fuelType === selectedFuel;

      return matchesSearch && matchesBrand && matchesFuel;
    });
  }, [allTemplates, searchTerm, selectedBrand, selectedFuel]);

  function handleSaveCustomTemplate(newTemplate: MaintenanceTemplate) {
    setCustomTemplates((prev) => [newTemplate, ...prev]);
    setIsCreating(false);
  }

  const brands = [
    { id: 'all', label: 'Todas las Marcas' },
    { id: 'Chevrolet', label: 'Chevrolet (15)' },
    { id: 'Toyota', label: 'Toyota (15)' },
    { id: 'Kia', label: 'Kia (12)' },
    { id: 'Hyundai', label: 'Hyundai (12)' },
    { id: 'Renault', label: 'Renault (10)' },
    { id: 'Nissan', label: 'Nissan (10)' },
    { id: 'Suzuki', label: 'Suzuki (8)' },
    { id: 'chinas', label: 'Chery / Great Wall / JAC (12)' },
    { id: 'Volkswagen', label: 'Volkswagen (3)' },
    { id: 'Ford', label: 'Ford (3)' },
    { id: 'Mazda', label: 'Mazda (3)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & New Sheet CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-base font-extrabold text-white">
              Catálogo Maestro OEM de 100+ Fichas Técnicas & Intervalos
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Pautas oficiales de mantenimiento, viscosidades de aceite, capacidades y bujías para el parque automotor de Ecuador
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-indigo-400 transition shrink-0"
        >
          <span>{isCreating ? '✕ Cancelar Creación' : '+ Crear Ficha Personalizada'}</span>
        </button>
      </div>

      {/* Custom Creator Form Drawer */}
      {isCreating && (
        <TemplateCreatorForm
          onSaveTemplate={handleSaveCustomTemplate}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Filter Controls */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        {/* Search Bar & Fuel selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por marca, modelo, motor o viscosidad (ej. Groove, Hilux, 5W-30, Sportage, D-Max)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedFuel}
              onChange={(e) => setSelectedFuel(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="all">Todos los Combustibles</option>
              <option value="gasoline">Solo Gasolina</option>
              <option value="diesel">Solo Diésel</option>
              <option value="hybrid">Híbridos (HEV/PHEV)</option>
            </select>
          </div>
        </div>

        {/* Brand Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBrand(b.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                selectedBrand === b.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Mostrando <strong className="text-white">{filteredTemplates.length}</strong> fichas de mantenimiento disponibles</span>
        {customTemplates.length > 0 && (
          <span className="text-indigo-400 font-semibold">({customTemplates.length} personalizadas por tu taller)</span>
        )}
      </div>

      {/* Grid of Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-md"
          >
            {/* Vehicle Photo Banner */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-950 border-b border-slate-800">
              {t.imageUrl ? (
                <img
                  src={t.imageUrl}
                  alt={`${t.brand} ${t.model}`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950/40">
                  <span className="text-3xl">🚗</span>
                </div>
              )}
              
              {/* Floating Badges */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs border border-white/10">
                  {t.brand}
                </span>
                {t.fuelType === 'hybrid' && (
                  <span className="rounded-md bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-xs border border-emerald-500/30">
                    ⚡ Híbrido
                  </span>
                )}
                {t.fuelType === 'electric' && (
                  <span className="rounded-md bg-cyan-950/80 px-2 py-0.5 text-[10px] font-bold text-cyan-300 backdrop-blur-xs border border-cyan-500/30">
                    🔋 100% Eléctrico
                  </span>
                )}
              </div>

              <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-xs border border-amber-500/20">
                {t.engineOil.viscosity}
              </span>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {t.model} {t.generationYears ? `(${t.generationYears})` : ''}
                  </h3>
                </div>

                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {t.engineDisplacement}
                </p>

                {/* Specs Pills */}
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/80 px-2.5 py-1 border border-slate-800">
                    <span className="text-slate-400">Aceite Motor:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {t.engineOil.viscosity} ({t.engineOil.capacityLiters}L)
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-950/80 px-2.5 py-1 border border-slate-800">
                    <span className="text-slate-400">Bujías:</span>
                    <span className="font-mono text-indigo-300 truncate max-w-[150px]">
                      {t.sparkPlugs?.spec || 'N/A (Diésel/EV)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-950/80 px-2.5 py-1 border border-slate-800 text-[10px]">
                    <span className="text-slate-400">Frenos / Coolant:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">
                      {t.brakeFluid} • {t.coolant.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveModalTemplate(t)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-center text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                >
                  📋 Ver Plan ({t.intervals.length} Intervalos)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Drawer with 10k - 100k km Roadmap */}
      {activeModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl space-y-5">
            {/* Modal Image Hero Banner */}
            {activeModalTemplate.imageUrl && (
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={activeModalTemplate.imageUrl}
                  alt={`${activeModalTemplate.brand} ${activeModalTemplate.model}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <button
                  type="button"
                  onClick={() => setActiveModalTemplate(null)}
                  className="absolute top-4 right-4 rounded-full bg-slate-950/80 p-2 text-slate-300 hover:text-white backdrop-blur-xs border border-white/10"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="p-6 pt-2 space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    {activeModalTemplate.brand} • Ficha Técnica Oficial
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {activeModalTemplate.model} ({activeModalTemplate.generationYears})
                  </h3>
                  <p className="text-xs text-slate-400">{activeModalTemplate.engineDisplacement}</p>
                </div>
                {!activeModalTemplate.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTemplate(null)}
                    className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Technical Specs Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Aceite Recomendado:</span>
                <strong className="text-amber-300 font-mono">{activeModalTemplate.engineOil.viscosity}</strong>
                <p className="text-[10px] text-slate-400">{activeModalTemplate.engineOil.spec}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Capacidad Cárter:</span>
                <strong className="text-white font-mono">{activeModalTemplate.engineOil.capacityLiters} Litros</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Bujías:</span>
                <strong className="text-indigo-300 font-mono text-[11px]">{activeModalTemplate.sparkPlugs?.spec || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Líquido de Frenos:</span>
                <strong className="text-slate-200">{activeModalTemplate.brakeFluid}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Refrigerante:</span>
                <strong className="text-slate-200 truncate block">{activeModalTemplate.coolant}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Transmisión:</span>
                <strong className="text-slate-200 truncate block">{activeModalTemplate.transmissionFluid || '75W-90 / ATF'}</strong>
              </div>
            </div>

            {/* Interval Steps List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cronograma de Mantenimientos por Kilometraje
              </h4>

              <div className="space-y-2.5">
                {activeModalTemplate.intervals.map((step: MaintenanceIntervalStep) => (
                  <div
                    key={step.mileageKm}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-indigo-600 px-2 py-0.5 font-mono text-xs font-black text-white">
                          {step.mileageKm.toLocaleString()} km
                        </span>
                        <strong className="text-xs text-slate-200">{step.title}</strong>
                      </div>
                      {step.estimatedCostUsd && (
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          ~${step.estimatedCostUsd} USD
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] font-semibold text-indigo-400 block mb-0.5">Operaciones Clave:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                          {step.operations.slice(0, 4).map((op, idx) => (
                            <li key={idx}>{op}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-amber-400 block mb-0.5">Repuestos Obligatorios:</span>
                        <div className="flex flex-wrap gap-1">
                          {step.mandatoryParts.map((p, idx) => (
                            <span key={idx} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalTemplate(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
