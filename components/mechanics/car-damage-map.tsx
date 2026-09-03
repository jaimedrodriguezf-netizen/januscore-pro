'use client';

import { useState } from 'react';
import {
  DAMAGE_TYPES,
  CAR_BODY_ZONES,
  type DamageMarker,
  type DamageType,
} from '@/lib/mechanics/damage-map';

interface CarDamageMapProps {
  markers: DamageMarker[];
  onChange: (markers: DamageMarker[]) => void;
}

export function CarDamageMap({ markers, onChange }: CarDamageMapProps) {
  const [activeType, setActiveType] = useState<DamageType>('C');
  const [selectedZone, setSelectedZone] = useState<string>(CAR_BODY_ZONES[0].name);
  const [note, setNote] = useState<string>('');

  function handleAddMarker(zoneName: string) {
    const newMarker: DamageMarker = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      zone: zoneName,
      damageType: activeType,
      label: note.trim() || undefined,
    };

    onChange([...markers, newMarker]);
    setNote('');
  }

  function handleRemoveMarker(id: string) {
    onChange(markers.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span>🚗</span> Mapa Visual de Carrocería & Daños Físicos
          </h4>
          <p className="text-[11px] text-slate-400">
            Selecciona el tipo de daño y haz clic en la zona del vehículo para marcar abolladuras, golpes o rayaduras
          </p>
        </div>

        {/* Damage Type Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(DAMAGE_TYPES) as DamageType[]).map((t) => {
            const info = DAMAGE_TYPES[t];
            const isSelected = activeType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveType(t)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? `${info.badge} shadow-sm ring-1 ring-white/20`
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span>{info.code}. {info.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Car Silhouette Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
        {/* View 1: Frente & Capó */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vista Delantera / Capó
          </span>
          <div className="relative mx-auto w-40 h-32 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/80 flex flex-col justify-between p-2">
            {/* Windshield */}
            <button
              type="button"
              onClick={() => handleAddMarker('Parabrisas Delantero')}
              className="h-7 w-full rounded-lg bg-sky-950/40 border border-sky-800/40 hover:bg-sky-900/40 text-[9px] text-sky-300 font-semibold transition"
            >
              Parabrisas Delantero
            </button>
            {/* Hood */}
            <button
              type="button"
              onClick={() => handleAddMarker('Capó')}
              className="h-10 w-full rounded-lg bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-[10px] text-slate-300 font-bold transition flex items-center justify-center gap-1"
            >
              <span>Capó</span>
              {markers.filter((m) => m.zone === 'Capó').map((m) => (
                <span key={m.id} className="h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {m.damageType}
                </span>
              ))}
            </button>
            {/* Front Bumper */}
            <button
              type="button"
              onClick={() => handleAddMarker('Parachoques Delantero')}
              className="h-6 w-full rounded-lg bg-slate-800/40 border border-slate-700 hover:bg-slate-800 text-[9px] text-slate-400 font-semibold transition"
            >
              Parachoques Delantero
            </button>
          </div>
        </div>

        {/* View 2: Vista Superior / Techo & Puertas */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vista Superior & Laterales
          </span>
          <div className="relative mx-auto w-44 h-32 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/80 flex items-center justify-between p-1.5 gap-1">
            {/* Left Side Doors */}
            <div className="flex flex-col gap-1 w-1/3">
              <button
                type="button"
                onClick={() => handleAddMarker('Puerta Delantera Izquierda')}
                className="h-12 rounded bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-[8px] text-slate-300 font-semibold p-1 leading-tight transition"
              >
                Puerta Del. Izq
              </button>
              <button
                type="button"
                onClick={() => handleAddMarker('Puerta Trasera Izquierda')}
                className="h-12 rounded bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-[8px] text-slate-300 font-semibold p-1 leading-tight transition"
              >
                Puerta Post. Izq
              </button>
            </div>

            {/* Roof / Center */}
            <button
              type="button"
              onClick={() => handleAddMarker('Techo')}
              className="h-full flex-1 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800/80 text-[10px] text-indigo-300 font-bold flex flex-col items-center justify-center transition"
            >
              <span>Techo</span>
              <span className="text-[8px] text-slate-500 font-normal">Superior</span>
            </button>

            {/* Right Side Doors */}
            <div className="flex flex-col gap-1 w-1/3">
              <button
                type="button"
                onClick={() => handleAddMarker('Puerta Delantera Derecha')}
                className="h-12 rounded bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-[8px] text-slate-300 font-semibold p-1 leading-tight transition"
              >
                Puerta Del. Der
              </button>
              <button
                type="button"
                onClick={() => handleAddMarker('Puerta Trasera Derecha')}
                className="h-12 rounded bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-[8px] text-slate-300 font-semibold p-1 leading-tight transition"
              >
                Puerta Post. Der
              </button>
            </div>
          </div>
        </div>

        {/* View 3: Posterior / Cajuela & Parachoques Trasero */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vista Posterior / Cajuela
          </span>
          <div className="relative mx-auto w-40 h-32 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/80 flex flex-col justify-between p-2">
            {/* Rear Glass */}
            <button
              type="button"
              onClick={() => handleAddMarker('Luna Posterior')}
              className="h-7 w-full rounded-lg bg-sky-950/40 border border-sky-800/40 hover:bg-sky-900/40 text-[9px] text-sky-300 font-semibold transition"
            >
              Luna Posterior
            </button>
            {/* Trunk */}
            <button
              type="button"
              onClick={() => handleAddMarker('Compuerta / Maletero')}
              className="h-10 w-full rounded-lg bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-[10px] text-slate-300 font-bold transition flex items-center justify-center gap-1"
            >
              <span>Maletero</span>
              {markers.filter((m) => m.zone.includes('Maletero')).map((m) => (
                <span key={m.id} className="h-4 w-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                  {m.damageType}
                </span>
              ))}
            </button>
            {/* Rear Bumper */}
            <button
              type="button"
              onClick={() => handleAddMarker('Parachoques Posterior')}
              className="h-6 w-full rounded-lg bg-slate-800/40 border border-slate-700 hover:bg-slate-800 text-[9px] text-slate-400 font-semibold transition"
            >
              Parachoques Posterior
            </button>
          </div>
        </div>
      </div>

      {/* Quick Dropdown Adder & Note */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
        >
          {CAR_BODY_ZONES.map((z) => (
            <option key={z.id} value={z.name}>
              {z.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Detalle opcional (ej. Rayadura superficial de 5cm)"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
        />

        <button
          type="button"
          onClick={() => handleAddMarker(selectedZone)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shrink-0"
        >
          <span>+ Agregar Marca</span>
        </button>
      </div>

      {/* List of Marked Damages */}
      {markers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Daños y Novedades Registradas ({markers.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {markers.map((m) => {
              const info = DAMAGE_TYPES[m.damageType] || DAMAGE_TYPES.A;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
                >
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${info.badge}`}>
                    {info.code}
                  </span>
                  <span className="font-semibold">{m.zone}</span>
                  {m.label && <span className="text-slate-400">({m.label})</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveMarker(m.id)}
                    className="text-slate-500 hover:text-rose-400 ml-1 text-xs"
                    title="Eliminar marca"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
