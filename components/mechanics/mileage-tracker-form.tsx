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
  const [mileageInput, setMileageInput] = useState<string>('');
  const [activeMileage, setActiveMileage] = useState<number | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate plan once unlocked
  const currentKm = activeMileage || initialMileage;
  const liveTarget = nextMileageTarget || Math.ceil((currentKm + 1) / 10000) * 10000;
  const plan: NextServicePlan = getNextServicePlan({
    nextMileage: liveTarget,
    currentMileage: currentKm,
    brand,
    model,
  });

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    const parsedKm = Number(mileageInput);
    if (!parsedKm || parsedKm <= 0) {
      setErrorMsg('Por favor ingresa un kilometraje válido mayor a 0.');
      return;
    }

    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('plate', plate);
    formData.append('mileage', String(parsedKm));

    startTransition(async () => {
      try {
        await onUpdateMileageAction(formData);
        setActiveMileage(parsedKm);
        setIsUnlocked(true);
      } catch {
        setErrorMsg('Error al guardar el kilometraje. Intenta nuevamente.');
      }
    });
  }

  function handleReset() {
    setIsUnlocked(false);
    setMileageInput(String(activeMileage || initialMileage));
  }

  return (
    <div className="rounded-3xl border border-indigo-500/30 bg-slate-900/95 p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
      {!isUnlocked ? (
        /* LOCKED STATE: High-Incentive Gate */
        <div className="space-y-5">
          {/* Header & Lock Icon */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-2xl shadow-inner animate-bounce">
              🔒
            </div>
            <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Pauta de Mantenimiento Protegida
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              ¿Quieres saber qué le toca a tu auto y cuántos km te quedan?
            </h2>
            <p className="mx-auto max-w-md text-xs text-slate-400 leading-relaxed">
              Para desbloquear la lista exacta de trabajos, cambio de fluidos, repuestos recomendados y fecha de tu próximo servicio, <strong>ingresa el kilometraje que marca tu tablero hoy</strong>:
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-center text-xs font-medium text-rose-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Unlock Input Form */}
          <form onSubmit={handleUnlock} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-300">
                Kilometraje de tu Tablero (Odómetro)
              </label>
              <div className="mt-2 relative">
                <input
                  type="number"
                  name="mileage"
                  required
                  min={1}
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  placeholder={`Ej. ${initialMileage || '80000'}`}
                  className="w-full rounded-2xl border-2 border-indigo-500/40 bg-slate-950 px-4 py-4 text-center font-mono text-2xl font-black text-indigo-300 placeholder-slate-600 focus:border-indigo-400 focus:outline-hidden shadow-inner"
                />
                <span className="absolute right-4 top-4.5 text-xs font-bold text-slate-500 uppercase font-mono">
                  KM
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 active:scale-[0.99] transition cursor-pointer"
            >
              {isPending ? 'Verificando con el Taller...' : '🔓 Desbloquear Mi Próximo Mantenimiento →'}
            </button>
          </form>

          {/* Teaser Preview with Blurred Locked Items */}
          <div className="pt-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 relative overflow-hidden">
              <div className="filter blur-xs opacity-40 select-none space-y-2 pointer-events-none">
                <div className="h-4 bg-slate-700 rounded-md w-3/4" />
                <div className="h-4 bg-slate-700 rounded-md w-5/6" />
                <div className="h-4 bg-slate-700 rounded-md w-2/3" />
                <div className="h-4 bg-slate-700 rounded-md w-4/5" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>🔒</span> Contenido protegido por kilometraje
                </span>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              💡 Al desbloquearlo, la lectura se guardará automáticamente para el historial de tu mecánico.
            </p>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE: Full Breakdown & Confirmation */
        <div className="space-y-6">
          {/* Celebration Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Diagnóstico Desbloqueado con Éxito
                </span>
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-white">
                Pauta Oficial para tus {currentKm.toLocaleString()} km
              </h2>
              <p className="text-xs text-slate-400">
                Lectura registrada en el taller para <strong>{plate}</strong> ({brand || ''} {model || ''})
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition shrink-0"
            >
              ✏️ Modificar Kilometraje
            </button>
          </div>

          {/* Main Status & Mileage Countdown Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Próximo Hito Programado</span>
              <p className="mt-1 text-base font-extrabold text-white">
                {plan.title}
              </p>
              <span className="mt-1 inline-block rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                {plan.typeBadge}
              </span>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-500">Estado de tu Vehículo</span>
              <p className={`mt-1 text-base font-extrabold font-mono ${plan.isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                {plan.isOverdue
                  ? '⚠️ Mantenimiento Requerido'
                  : `✓ Te faltan ~${plan.remainingKm.toLocaleString()} km`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {plan.isOverdue ? 'Kilometraje cumplido' : 'Vehículo en rango operativo'}
              </p>
            </div>
          </div>

          {/* Checklist of what's due */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>📋</span> Lista de Trabajos y Chequeos a Realizar:
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {plan.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fluid & Part Specifications */}
          {plan.fluidSpecs.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Especificaciones Técnicas Recomendadas:</span>
              <div className="space-y-1">
                {plan.fluidSpecs.map((spec, i) => (
                  <p key={i} className="text-[11px] text-slate-300">• {spec}</p>
                ))}
              </div>
            </div>
          )}

          {/* Saved Notification Banner */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-center text-xs text-emerald-300">
            ✓ Tu mecánico ya tiene registrado que tu auto está en <strong>{currentKm.toLocaleString()} km</strong>.
          </div>

          {/* WhatsApp Direct Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-slate-400 max-w-sm">
              {plan.recommendation}
            </p>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Hola, acabo de ingresar el odómetro de mi vehículo (${plate} - ${brand || ''} ${model || ''}) a ${currentKm.toLocaleString()} km y deseo solicitar una cita/cotización para el "${plan.title}".`
              )}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition shrink-0"
            >
              <span>📲 Agendar este Servicio por WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
