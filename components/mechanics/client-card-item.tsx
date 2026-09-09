'use client';

import { useState } from 'react';
import type { WorkshopClientAggregate } from '@/lib/mechanics/client-directory';
import { ClientEditModal } from './client-edit-modal';

interface ClientCardItemProps {
  client: WorkshopClientAggregate;
  tenantId: string;
  tenantName: string;
  updateAction: (formData: FormData) => Promise<void>;
}

export function ClientCardItem({
  client,
  tenantId,
  tenantName,
  updateAction,
}: ClientCardItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : null;
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
        `Hola ${client.name}, te escribimos de ${tenantName || 'nuestro taller mecánico'}.`
      )}`
    : null;

  return (
    <>
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700 transition">
        <div className="space-y-3">
          {/* Top Bar: Name & Badges */}
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <h3 className="text-sm font-bold text-slate-100">{client.name}</h3>
              </div>
              {client.identification && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="text-slate-500">CI/RUC:</span>
                  <span className="font-mono font-semibold text-indigo-300">
                    {client.identification}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {client.isFleetOwner && (
                <span className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 text-[10px] font-bold text-indigo-300">
                  🚗 Flota ({client.vehicles.length} autos)
                </span>
              )}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/30 transition"
                >
                  <span>📲 WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <span>✏️ Editar</span>
              </button>
            </div>
          </div>

          {/* Contact Info & Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Teléfono:</span>
              <span className="font-mono text-slate-200">
                {client.phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Correo Electrónico:</span>
              <span className="text-slate-300 truncate block">
                {client.email || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Mantenimientos Totales:</span>
              <span className="font-bold text-indigo-300">
                {client.totalServices} servicio{client.totalServices !== 1 ? 's' : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Último Mantenimiento:</span>
              <span className="text-slate-300">
                {client.lastServiceDate
                  ? new Date(client.lastServiceDate).toLocaleDateString('es-EC', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Sin registros'}
              </span>
            </div>
          </div>

          {/* Vehicles Portfolio */}
          <div className="pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Vehículos Registrados ({client.vehicles.length})
            </span>
            <div className="space-y-1.5">
              {client.vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      {v.plate}
                    </span>
                    <span className="text-slate-300">
                      {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-400">
                      {v.current_mileage.toLocaleString()} km
                    </span>
                    <a
                      href={`/auto/${v.plate}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      Ficha ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <ClientEditModal
          client={client}
          tenantId={tenantId}
          onClose={() => setIsEditing(false)}
          action={updateAction}
        />
      )}
    </>
  );
}
