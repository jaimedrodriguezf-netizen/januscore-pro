'use client';

import { useState } from 'react';
import type { WorkshopClientAggregate } from '@/lib/mechanics/client-directory';

interface ClientEditModalProps {
  client: WorkshopClientAggregate;
  tenantId: string;
  onClose: () => void;
  action: (formData: FormData) => Promise<void>;
}

export function ClientEditModal({
  client,
  tenantId,
  onClose,
  action,
}: ClientEditModalProps) {
  const [name, setName] = useState(client.name || '');
  const [identification, setIdentification] = useState(client.identification || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [email, setEmail] = useState(client.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('tenantId', tenantId);
      if (client.identification) {
        formData.append('originalIdentification', client.identification);
      }
      formData.append('originalName', client.name);
      formData.append('name', name);
      formData.append('identification', identification);
      formData.append('phone', phone);
      formData.append('email', email);

      await action(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <h3 className="text-sm font-bold text-slate-100">Editar Datos del Cliente</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Los cambios se sincronizarán en todos los vehículos asociados a este cliente ({client.vehicles.length} vehículo{client.vehicles.length > 1 ? 's' : ''}).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Nombre Completo / Razón Social <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez o Empresa S.A."
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Cédula o RUC
            </label>
            <input
              type="text"
              name="identification"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder="1719623512"
              className="mt-1 w-full font-mono rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              WhatsApp / Teléfono
            </label>
            <input
              type="text"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0991234567"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@correo.com"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
