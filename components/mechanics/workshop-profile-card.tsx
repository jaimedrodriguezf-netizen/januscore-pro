import React from 'react';
import { formatGoogleMapsUrl, formatWhatsAppUrl, type WorkshopProfile } from '@/lib/mechanics/workshop-profile';

interface WorkshopProfileCardProps {
  workshop: WorkshopProfile;
  plate?: string;
  vehicleModel?: string;
  currentKm?: number;
  serviceTitle?: string;
  className?: string;
}

export function WorkshopProfileCard({
  workshop,
  plate,
  vehicleModel,
  currentKm,
  serviceTitle,
  className = '',
}: WorkshopProfileCardProps) {
  const whatsappUrl = plate
    ? formatWhatsAppUrl({
        phone: workshop.whatsappPhone || workshop.phone,
        plate,
        vehicleModel,
        currentKm,
        serviceTitle,
      })
    : workshop.whatsappPhone
    ? `https://api.whatsapp.com/send?phone=${workshop.whatsappPhone.replace(/\D/g, '')}&text=${encodeURIComponent(
        `Hola ${workshop.name}, deseo realizar una consulta sobre sus servicios automotrices.`
      )}`
    : null;

  const mapsUrl = formatGoogleMapsUrl({
    googleMapsUrl: workshop.googleMapsUrl,
    address: workshop.address,
    city: workshop.city,
  });

  return (
    <div className={`rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-xl ${className}`}>
      {/* Header & Logo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          {workshop.logoUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-1 shadow-md shrink-0">
              <img
                src={workshop.logoUrl}
                alt={workshop.name}
                className="h-full w-full object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600/10 text-2xl font-black text-indigo-400 shrink-0">
              {workshop.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Taller Autorizado ✓
              </span>
              <span className="text-[10px] font-mono text-slate-400">/{workshop.slug}</span>
            </div>
            <h2 className="mt-1 text-lg font-black text-white leading-tight">
              {workshop.name}
            </h2>
            {workshop.description && (
              <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                {workshop.description}
              </p>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        {workshop.operatingHours && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Horario de Atención</span>
            <span className="text-xs font-semibold text-slate-200">{workshop.operatingHours}</span>
          </div>
        )}
      </div>

      {/* Details & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs text-slate-300">
        {workshop.address && (
          <div className="flex items-start gap-2.5">
            <span className="text-base text-indigo-400 shrink-0">📍</span>
            <div>
              <strong className="block text-[11px] font-bold uppercase text-slate-400">Ubicación</strong>
              <span>
                {workshop.address} {workshop.city ? `• ${workshop.city}` : ''}
              </span>
            </div>
          </div>
        )}

        {(workshop.whatsappPhone || workshop.phone) && (
          <div className="flex items-start gap-2.5">
            <span className="text-base text-emerald-400 shrink-0">📞</span>
            <div>
              <strong className="block text-[11px] font-bold uppercase text-slate-400">Contacto Directo</strong>
              <span className="font-mono font-medium">
                {workshop.whatsappPhone || workshop.phone}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: WhatsApp & Google Maps */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 hover:scale-[1.01] transition active:scale-95"
          >
            <span className="text-base">📲</span>
            <span>Contactar / Agendar por WhatsApp</span>
          </a>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 px-5 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-95"
          >
            <span className="text-base">📍</span>
            <span>Cómo Llegar (Google Maps)</span>
          </a>
        )}

        {workshop.phone && (
          <a
            href={`tel:${workshop.phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <span>📞 Llamar</span>
          </a>
        )}
      </div>
    </div>
  );
}
