'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onboardTenantAction } from '@/app/actions/onboarding';

interface TenantWizardProps {
  userEmail: string;
}

type BusinessType = 'mechanics' | 'financial_receipts' | 'all';

interface BusinessTypeConfig {
  badge: string;
  badgeColor: string;
  heading: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  slugPrefix: string;
  slugPlaceholder: string;
  slugHint: string;
  submitButtonText: string;
  loadingText: string;
  invitationText: string;
}

const BUSINESS_CONFIGS: Record<BusinessType, BusinessTypeConfig> = {
  mechanics: {
    badge: '🚗 Taller Mecánico & Automotriz',
    badgeColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    heading: 'Activá tu Taller Mecánico',
    description: 'Nacerás como Admin de Empresa para gestionar vehículos, órdenes de trabajo, fichas y a tus mecánicos.',
    nameLabel: 'Nombre de tu Taller Mecánico *',
    namePlaceholder: 'ej. Taller Mecánico San Martín',
    slugPrefix: 'januscore.pro/m/',
    slugPlaceholder: 'mi-taller',
    slugHint: 'Esta URL la usarán tus clientes para consultar sus fichas de mantenimiento.',
    submitButtonText: '✨ Crear mi Taller y Comenzar',
    loadingText: 'Aprovisionando tu Taller...',
    invitationText: '¿Trabajás en un taller ya existente? Pedile a tu administrador que te agregue con tu correo:',
  },
  financial_receipts: {
    badge: '🧾 Comprobantes & Facturación SRI',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    heading: 'Activá tu Empresa de Comprobantes & Facturación',
    description: 'Nacerás como Admin de Empresa para auditar comprobantes bancarios, facturación SRI CipherByte y métricas.',
    nameLabel: 'Nombre de tu Empresa o Entidad *',
    namePlaceholder: 'ej. Soluciones Financieras & Auditoría S.A.',
    slugPrefix: 'januscore.pro/c/',
    slugPlaceholder: 'mi-empresa',
    slugHint: 'Identificador único de tu organización para el portal de carga y validación.',
    submitButtonText: '✨ Crear mi Empresa de Comprobantes',
    loadingText: 'Aprovisionando tu Empresa...',
    invitationText: '¿Tu empresa ya está registrada en la plataforma? Pedile a tu administrador que te asigne con tu correo:',
  },
  all: {
    badge: '🌐 Suite Completa (Ambos Módulos)',
    badgeColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    heading: 'Activá tu Organización Integral',
    description: 'Nacerás como Admin de Empresa con acceso a la suite completa: taller automotriz, comprobantes y facturación electrónica.',
    nameLabel: 'Nombre de tu Organización Integral *',
    namePlaceholder: 'ej. Grupo Empresarial & Automotriz S.A.',
    slugPrefix: 'januscore.pro/org/',
    slugPlaceholder: 'mi-organizacion',
    slugHint: 'Identificador único de tu organización para la suite integral.',
    submitButtonText: '✨ Crear mi Organización Integral',
    loadingText: 'Aprovisionando tu Organización...',
    invitationText: '¿Tu organización ya está registrada? Pedile a tu administrador que te sume a su equipo con tu correo:',
  },
};

export function TenantWizard({ userEmail }: TenantWizardProps) {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<BusinessType>('mechanics');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = BUSINESS_CONFIGS[businessType];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    const generatedSlug = newName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la empresa o taller es obligatorio.' );
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('slug', slug.trim());
    formData.append('businessType', businessType);

    const result = await onboardTenantAction(formData);
    if (!result.success) {
      setError(result.error || 'Ocurrió un error al configurar la empresa.' );
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Dynamic Header Badge & Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-3xl">
            🚀
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 font-mono text-xs font-bold border mb-2 ${currentConfig.badgeColor}`}>
            {currentConfig.badge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {currentConfig.heading}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {currentConfig.description}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            ⚠️ {error}
          </div>
        )}

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Business Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Selecciona tu Tipo de Negocio
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setBusinessType('mechanics')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  businessType === 'mechanics'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xl">🚗</span>
                <span className="mt-1 text-xs font-bold text-white">Taller Mecánico</span>
                <span className="text-[10px] text-slate-400">Órdenes, autos y QR</span>
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('financial_receipts')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  businessType === 'financial_receipts'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xl">🧾</span>
                <span className="mt-1 text-xs font-bold text-white">Comprobantes</span>
                <span className="text-[10px] text-slate-400">Auditoría & SRI</span>
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('all')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  businessType === 'all'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xl">🌐</span>
                <span className="mt-1 text-xs font-bold text-white">Ambos Módulos</span>
                <span className="text-[10px] text-slate-400">Suite integral</span>
              </button>
            </div>
          </div>

          {/* Step 2: Name Input (Dynamic label & placeholder) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              2. {currentConfig.nameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder={currentConfig.namePlaceholder}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Step 3: Web Identifier / Slug */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              3. Identificador Web (Acceso exclusivo)
            </label>
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-400 focus-within:border-indigo-500">
              <span className="text-slate-500 select-none text-xs font-mono">{currentConfig.slugPrefix}</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder={currentConfig.slugPlaceholder}
                className="w-full bg-transparent pl-1 text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {currentConfig.slugHint}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{currentConfig.loadingText}</span>
              </>
            ) : (
              <span>{currentConfig.submitButtonText}</span>
            )}
          </button>
        </form>

        {/* Dynamic Alternative: Invitation Notice */}
        <div className="mt-8 border-t border-slate-800 pt-5 text-center space-y-2">
          <p className="text-xs text-slate-400">
            {currentConfig.invitationText}
          </p>
          <p className="font-mono text-xs font-semibold text-slate-300">
            {userEmail}
          </p>
          <div className="pt-2">
            <Link
              href="/auto"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition"
            >
              <span>🔍 Consultar Ficha Pública de Vehículo con QR</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
