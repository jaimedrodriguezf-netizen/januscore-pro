'use client';

import React, { useState } from 'react';
import { sanitizeSlug, isValidSlug, type WorkshopProfile } from '@/lib/mechanics/workshop-profile';
import { WorkshopProfileCard } from './workshop-profile-card';

interface WorkshopProfileSettingsProps {
  initialProfile: WorkshopProfile;
  onSaveAction: (formData: FormData) => Promise<void>;
}

export function WorkshopProfileSettings({
  initialProfile,
  onSaveAction,
}: WorkshopProfileSettingsProps) {
  const [name, setName] = useState(initialProfile.name || '');
  const [slug, setSlug] = useState(initialProfile.slug || '');
  const [logoUrl, setLogoUrl] = useState(initialProfile.logoUrl || '');
  const [whatsappPhone, setWhatsappPhone] = useState(initialProfile.whatsappPhone || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [address, setAddress] = useState(initialProfile.address || '');
  const [city, setCity] = useState(initialProfile.city || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialProfile.googleMapsUrl || '');
  const [operatingHours, setOperatingHours] = useState(initialProfile.operatingHours || 'Lun - Sáb: 08:00 - 18:00');
  const [description, setDescription] = useState(initialProfile.description || 'Mantenimiento Preventivo, ABC de Motor, Diagnóstico Computarizado');

  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newName = e.target.value;
    setName(newName);
    // If slug was empty or auto-generated, suggest slug from name
    if (!initialProfile.slug || initialProfile.slug === 'default-tenant') {
      const suggested = sanitizeSlug(newName);
      setSlug(suggested);
      setSlugError(isValidSlug(suggested) ? null : 'El slug debe tener entre 3 y 50 caracteres alfanuméricos.');
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setSlug(raw);
    if (!isValidSlug(raw)) {
      setSlugError('El slug debe contener solo letras minúsculas, números y guiones (ej. taller-perez).');
    } else {
      setSlugError(null);
    }
  }

  const liveProfile: WorkshopProfile = {
    id: initialProfile.id,
    name: name.trim() || 'Mi Taller Mecánico',
    slug: slug.trim() || 'mi-taller',
    logoUrl: logoUrl.trim() || null,
    whatsappPhone: whatsappPhone.trim() || null,
    phone: phone.trim() || null,
    address: address.trim() || null,
    city: city.trim() || null,
    googleMapsUrl: googleMapsUrl.trim() || null,
    operatingHours: operatingHours.trim() || null,
    description: description.trim() || null,
    isActive: true,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Identidad de Marca & Contacto
            </span>
            <h2 className="text-lg font-black text-white">
              Configuración del Perfil de la Mecánica
            </h2>
            <p className="text-xs text-slate-400">
              Personaliza el nombre, logo, enlace público (slug), WhatsApp y ubicación en Google Maps de tu taller
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Portal Público:
            </span>
            <span className="rounded-lg bg-indigo-950 border border-indigo-500/30 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300">
              januscore.pro/m/{slug || 'tu-taller'}
            </span>
          </div>
        </div>

        <form
          action={async (formData) => {
            if (slugError) return;
            setIsSaving(true);
            try {
              await onSaveAction(formData);
              setIsSaved(true);
              setTimeout(() => setIsSaved(false), 4000);
            } finally {
              setIsSaving(false);
            }
          }}
          className="mt-6 space-y-5"
        >
          <input type="hidden" name="tenantId" value={initialProfile.id} />

          {/* Row 1: Name & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200">
                Nombre Comercial de la Mecánica *
              </label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="Ej. Taller Mecánico Pílozo & Asociados"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200">
                Enlace / Slug de tu Taller (URL Única) *
              </label>
              <div className="mt-1.5 flex rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500">
                <span className="inline-flex items-center px-3 text-xs text-slate-500 font-mono border-r border-slate-800 bg-slate-900/60">
                  januscore.pro/m/
                </span>
                <input
                  type="text"
                  name="slug"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="mecanica-pilozo"
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-indigo-300 font-mono font-bold focus:outline-hidden"
                />
              </div>
              {slugError && (
                <p className="mt-1 text-[11px] text-rose-400 font-medium">
                  ⚠️ {slugError}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Logo URL & WhatsApp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200">
                Logo de la Mecánica (URL de Imagen)
              </label>
              <input
                type="url"
                name="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://mi-dominio.com/logo.png o enlace a imagen"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-indigo-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden font-mono"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Recomendado: PNG o JPG con fondo transparente o cuadrado
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200">
                📲 Teléfono WhatsApp de Atención al Cliente *
              </label>
              <input
                type="text"
                name="whatsappPhone"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ej. 0991234567 o +593991234567"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-emerald-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden font-mono font-bold"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Este es el número al que se enviarán los agendamientos de los clientes automáticamente
              </p>
            </div>
          </div>

          {/* Row 3: Address, City & Google Maps URL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200">
                Dirección Física del Taller
              </label>
              <input
                type="text"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Av. De las Américas y Plaza Dañín"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200">
                Ciudad / Provincia
              </label>
              <input
                type="text"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Guayaquil, Ecuador"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200">
                📍 Enlace Google Maps (Opcional)
              </label>
              <input
                type="url"
                name="googleMapsUrl"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-indigo-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Row 4: Operating Hours & Slogan Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200">
                Horario de Atención
              </label>
              <input
                type="text"
                name="operatingHours"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="Lun - Vie: 08:00 - 18:00 | Sáb: 08:30 - 14:00"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200">
                Slogan / Especialidades del Taller
              </label>
              <input
                type="text"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Especialistas en Inyección, ABC de Motor y Reparaciones Multimarca"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-400">
                ✓ ¡Perfil de la mecánica actualizado con éxito!
              </span>
            )}
            {!isSaved && <div />}

            <button
              type="submit"
              disabled={isSaving || !!slugError}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer"
            >
              {isSaving ? 'Guardando...' : '💾 Guardar Datos del Taller'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview of the Workshop Profile Card */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
          👁️ Vista Previa de la Ficha Profesional (Así lo verán tus clientes):
        </span>
        <WorkshopProfileCard
          workshop={liveProfile}
          plate="ABC-1234"
          vehicleModel="Vehículo de Demostración"
          currentKm={50000}
          serviceTitle="Mantenimiento Preventivo"
        />
      </div>
    </div>
  );
}
