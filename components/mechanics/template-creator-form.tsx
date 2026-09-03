'use client';

import { useState } from 'react';
import {
  type MaintenanceTemplate,
  type FuelType,
} from '@/lib/mechanics/maintenance-templates';
import {
  buildCustomTemplate,
  validateCustomTemplate,
} from '@/lib/mechanics/template-service';

interface TemplateCreatorFormProps {
  onSaveTemplate: (template: MaintenanceTemplate) => void;
  onCancel?: () => void;
  initialData?: Partial<MaintenanceTemplate>;
}

export function TemplateCreatorForm({
  onSaveTemplate,
  onCancel,
  initialData,
}: TemplateCreatorFormProps) {
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [generationYears, setGenerationYears] = useState(initialData?.generationYears || '2022-2025');
  const [engineDisplacement, setEngineDisplacement] = useState(initialData?.engineDisplacement || '1.5L DOHC 16V');
  const [fuelType, setFuelType] = useState<FuelType>(initialData?.fuelType || 'gasoline');
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');
  
  // Fluids & parts
  const [oilViscosity, setOilViscosity] = useState(initialData?.engineOil?.viscosity || '5W-30');
  const [oilSpec, setOilSpec] = useState(initialData?.engineOil?.spec || 'API SP / ILSAC GF-6 / Dexos 1 Gen 3');
  const [oilCapacity, setOilCapacity] = useState<number>(initialData?.engineOil?.capacityLiters || 4.0);
  
  const [sparkPlugType, setSparkPlugType] = useState(initialData?.sparkPlugs?.type || 'Iridio');
  const [sparkPlugSpec, setSparkPlugSpec] = useState(initialData?.sparkPlugs?.spec || 'DENSO / NGK Iridium');
  const [sparkPlugInterval, setSparkPlugInterval] = useState<number>(initialData?.sparkPlugs?.intervalKm || 40000);

  const [brakeFluid, setBrakeFluid] = useState(initialData?.brakeFluid || 'DOT 4');
  const [coolant, setCoolant] = useState(initialData?.coolant || 'OAT Larga Duración Rojo / Azul 50/50');
  const [transmissionFluid, setTransmissionFluid] = useState(initialData?.transmissionFluid || 'CVT NS-3 / ATF SP-IV / 75W-90');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const partialData: Partial<MaintenanceTemplate> = {
      brand,
      model,
      generationYears,
      engineDisplacement,
      fuelType,
      imageUrl: imageUrl.trim() || undefined,
      engineOil: {
        viscosity: oilViscosity,
        spec: oilSpec,
        capacityLiters: Number(oilCapacity) || 4.0,
      },
      sparkPlugs: {
        type: sparkPlugType,
        spec: sparkPlugSpec,
        intervalKm: Number(sparkPlugInterval) || 40000,
      },
      brakeFluid,
      coolant,
      transmissionFluid: transmissionFluid.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const validation = validateCustomTemplate(partialData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    const fullTemplate = buildCustomTemplate(partialData);
    onSaveTemplate(fullTemplate);
    setIsSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <div>
            <h3 className="text-sm font-bold text-white">Crear / Personalizar Ficha de Mantenimiento OEM</h3>
            <p className="text-xs text-slate-400">
              Registra las especificaciones de fluidos, bujías e intervalos de servicio para tu taller
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1"
          >
            ✕ Cerrar
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
          <ul className="list-disc pl-4 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {isSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-300">
          ✓ Ficha técnica guardada exitosamente y disponible en el catálogo de tu taller.
        </div>
      )}

      {/* 1. Identification */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-300">Marca *</label>
          <input
            type="text"
            required
            placeholder="Ej. Chevrolet / BYD / Toyota"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300">Modelo *</label>
          <input
            type="text"
            required
            placeholder="Ej. Groove 1.5 / Song Plus"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300">Rango de Años / Generación</label>
          <input
            type="text"
            placeholder="Ej. 2021-2025"
            value={generationYears}
            onChange={(e) => setGenerationYears(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-300">Motorización & Cilindraje</label>
          <input
            type="text"
            placeholder="Ej. 1.5L DOHC DVVT 110 HP"
            value={engineDisplacement}
            onChange={(e) => setEngineDisplacement(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300">Tipo de Combustible / Propulsión</label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="gasoline">Gasolina</option>
            <option value="diesel">Diésel (CRDI / Turbo)</option>
            <option value="hybrid">Híbrido (HEV / MHEV / PHEV)</option>
            <option value="electric">100% Eléctrico (EV)</option>
          </select>
        </div>
      </div>

      {/* Image URL with live preview */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
        <label className="block text-[11px] font-medium text-slate-300">
          🖼️ URL de Foto del Vehículo (Opcional):
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="url"
            placeholder="https://images.unsplash.com/... o enlace directo a imagen"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-indigo-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden font-mono"
          />
          {imageUrl && (
            <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <img src={imageUrl} alt="Vista previa" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Fluid Specs */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          🧪 Especificación Oficial de Aceite de Motor
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-slate-400">Viscosidad Recomendada:</label>
            <input
              type="text"
              required
              placeholder="0W-20 / 5W-30 / 10W-40"
              value={oilViscosity}
              onChange={(e) => setOilViscosity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold text-amber-300 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400">Norma OEM / Fabricante:</label>
            <input
              type="text"
              placeholder="API SP / Dexos 1 Gen 3 / VW 507.00"
              value={oilSpec}
              onChange={(e) => setOilSpec(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400">Capacidad con Filtro (Litros / Gal):</label>
            <input
              type="number"
              step="0.1"
              placeholder="4.0"
              value={oilCapacity}
              onChange={(e) => setOilCapacity(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Spark Plugs & Auxiliary Fluids */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          ⚡ Bujías, Frenos, Refrigerante y Transmisión
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-slate-400">Tipo de Bujía:</label>
            <select
              value={sparkPlugType}
              onChange={(e) => setSparkPlugType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Iridio">Iridio (40.000 - 60.000 km)</option>
              <option value="Platino">Platino (30.000 - 40.000 km)</option>
              <option value="Cobre / Níquel">Cobre / Níquel (20.000 km)</option>
              <option value="No aplica">No aplica (Diésel / EV)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400">Referencia / Código de Bujía:</label>
            <input
              type="text"
              placeholder="DENSO IXU22 / NGK SC16HR11"
              value={sparkPlugSpec}
              onChange={(e) => setSparkPlugSpec(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-indigo-300 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400">Líquido de Frenos:</label>
            <input
              type="text"
              placeholder="DOT 4 / DOT 4 Low Viscosity"
              value={brakeFluid}
              onChange={(e) => setBrakeFluid(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] text-slate-400">Líquido Refrigerante:</label>
            <input
              type="text"
              placeholder="OAT Orgánico 50/50 Rojo / Azul / Toyota SLLC"
              value={coolant}
              onChange={(e) => setCoolant(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400">Fluido de Transmisión / Caja:</label>
            <input
              type="text"
              placeholder="CVT NS-3 / ATF SP-IV / 75W-90 GL-4"
              value={transmissionFluid}
              onChange={(e) => setTransmissionFluid(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition"
        >
          💾 Guardar Ficha y Auto-Calcular Intervalos OEM →
        </button>
      </div>
    </form>
  );
}
