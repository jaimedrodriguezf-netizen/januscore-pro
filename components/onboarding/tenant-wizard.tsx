'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onboardTenantAction } from '@/app/actions/onboarding';

interface TenantWizardProps {
  userEmail: string;
}

export function TenantWizard({ userEmail }: TenantWizardProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [businessType, setBusinessType] = useState<'mechanics' | 'financial_receipts' | 'all'>('mechanics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    // Auto-generate clean slug
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
      setError('El nombre del taller o empresa es obligatorio.' );
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

    // Refresh page to load into the freshly provisioned tenant dashboard
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Header Badge & Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-3xl">
            🚀
          </div>
          <span className="inline-flex rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 font-mono text-xs font-bold text-indigo-300 mb-2">
            Configuración de tu Espacio de Trabajo
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Activá tu Taller o Empresa
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Nacerás como <strong className="text-indigo-300 font-semibold">Admin de Empresa</strong> para gestionar vehículos, órdenes de trabajo y a tu equipo.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            ⚠️ {error}
          </div>
        )}

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre de tu Taller / Empresa *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="ej. Taller Mecánico San Martín"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Identificador Web (Slug de acceso público)
            </label>
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-400 focus-within:border-indigo-500">
              <span className="text-slate-500 select-none text-xs">januscore.pro/m/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="mi-taller"
                className="w-full bg-transparent pl-1 text-sm text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Esta URL la usarán tus clientes para consultar sus fichas de mantenimiento.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Tipo de Negocio / Módulo Principal
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setBusinessType('mechanics')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  businessType === 'mechanics'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">🚗</span>
                <span className="mt-1 text-xs font-bold">Taller Mecánico</span>
                <span className="text-[10px] text-slate-500">Órdenes y autos</span>
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('financial_receipts')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  businessType === 'financial_receipts'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">🧾</span>
                <span className="mt-1 text-xs font-bold">Comprobantes</span>
                <span className="text-[10px] text-slate-500">Facturación SRI</span>
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('all')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  businessType === 'all'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">🌐</span>
                <span className="mt-1 text-xs font-bold">Ambos Módulos</span>
                <span className="text-[10px] text-slate-500">Suite integral</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Aprovisionando tu Taller...</span>
              </>
            ) : (
              <>
                <span>✨ Crear mi Taller y Comenzar</span>
              </>
            )}
          </button>
        </form>

        {/* Alternative: Invitation Notice */}
        <div className="mt-8 border-t border-slate-800 pt-5 text-center space-y-2">
          <p className="text-xs text-slate-400">
            ¿Trabajás en un taller ya existente? Pedile a tu administrador que te agregue usando tu correo:
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
