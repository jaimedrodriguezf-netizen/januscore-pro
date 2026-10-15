'use client';

import React, { useState, useEffect } from 'react';
import { B2B_PRODUCTS, AI_SERVICES } from '@/lib/catalog/products';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterest?: string;
}

export function LeadModal({ isOpen, onClose, initialInterest }: LeadModalProps) {
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState(initialInterest || 'januscore-verify');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialInterest) {
      setInterest(initialInterest);
    }
  }, [initialInterest]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getInterestLabel = () => {
    const prod = B2B_PRODUCTS.find((p) => p.id === interest);
    if (prod) return prod.name;
    const srv = AI_SERVICES.find((s) => s.id === interest);
    if (srv) return srv.title;
    return 'Consultoría General de Automatización';
  };

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    const interestLabel = getInterestLabel();
    const text = `Hola JanusCore Engineering! 👋\n\n` +
      `Me interesa coordinar una demo / cotización:\n` +
      `• *Solución / Interés:* ${interestLabel}\n` +
      `• *Empresa:* ${company.trim() || 'No especificada'}\n` +
      `• *Contacto:* ${contactName.trim() || 'No especificado'}\n` +
      `• *Email:* ${email.trim() || 'No especificado'}\n` +
      `• *Teléfono:* ${phone.trim() || 'No especificado'}\n` +
      (message.trim() ? `• *Detalle del requerimiento:* ${message.trim()}\n` : '');

    // Default contact phone (+593984606775 or direct api link)
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=593984606775&text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleEmailSend = () => {
    const interestLabel = getInterestLabel();
    const subject = encodeURIComponent(`[JanusCore B2B] Consulta: ${interestLabel} - ${company || contactName || 'Nuevo Cliente'}`);
    const body = encodeURIComponent(
      `Hola JanusCore Team,\n\n` +
      `Solicito información / cotización sobre: ${interestLabel}\n\n` +
      `Datos de la empresa:\n` +
      `- Empresa: ${company}\n` +
      `- Nombre de contacto: ${contactName}\n` +
      `- Teléfono / WhatsApp: ${phone}\n` +
      `- Email: ${email}\n\n` +
      `Requerimiento:\n${message}\n`
    );
    window.location.href = `mailto:jaimedrodriguezf@gmail.com?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Captación B2B & Licenciamiento
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Agendar Demo / Cotizar Solución
            </h3>
            <p className="text-xs text-slate-400">
              Evaluamos la factibilidad técnica y operativa de tu requerimiento en menos de 24 horas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleWhatsAppSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Solución o Producto de Interés *
            </label>
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <optgroup label="Productos B2B Listos">
                {B2B_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.category})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Servicios de Automatización & IA a Medida">
                {AI_SERVICES.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.title}
                  </option>
                ))}
                <option value="custom">Otra Solución de Automatización a Medida</option>
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de la Empresa o Negocio
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej. Corporación Comercial / Distribuidora / Clínica"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ej. Ing. Carlos Pérez"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp / Teléfono *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+593 99 999 9999"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detalle del Requerimiento u Operación Actual
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cuéntanos brevemente qué proceso deseas automatizar o qué producto necesitas implementar..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-95"
            >
              <span>📲 Enviar por WhatsApp</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={handleEmailSend}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition"
            >
              <span>✉️ Enviar por Correo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
