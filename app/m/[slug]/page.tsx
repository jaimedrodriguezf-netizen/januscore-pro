import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatPlate } from '@/lib/mechanics/service';
import { WorkshopProfileCard } from '@/components/mechanics/workshop-profile-card';
import type { WorkshopProfile } from '@/lib/mechanics/workshop-profile';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export default async function WorkshopPublicPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; err?: string }>;
}) {
  const { slug } = await params;
  const { q, err } = await searchParams;

  const supabase = await createSupabaseServerClient();

  // Query tenant by slug
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100 font-sans">
        <div className="mx-auto max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-3xl">
            🏬
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-100">Taller No Encontrado</h1>
          <p className="mt-2 text-xs text-slate-400">
            El enlace <span className="font-mono text-indigo-400">/m/{slug}</span> no corresponde a una mecánica registrada o activa.
          </p>
          <div className="mt-6">
            <Link
              href="/auto"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
            >
              ← Ir al buscador general
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const workshop: WorkshopProfile = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logo_url,
    whatsappPhone: tenant.whatsapp_phone,
    phone: tenant.phone,
    address: tenant.address,
    city: tenant.city,
    googleMapsUrl: tenant.google_maps_url,
    operatingHours: tenant.operating_hours,
    description: tenant.description,
    isActive: tenant.is_active,
  };

  // Form search action for this workshop
  async function searchPlateAction(formData: FormData) {
    'use server';
    const rawPlate = String(formData.get('plate') || '').trim();
    if (!rawPlate) return;
    const formatted = formatPlate(rawPlate);
    redirect(`/m/${slug}/${formatted}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3.5 sticky top-0 z-20">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            {workshop.logoUrl ? (
              <img src={workshop.logoUrl} alt={workshop.name} className="h-7 w-7 object-contain rounded-lg" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
                {workshop.name.slice(0, 1)}
              </span>
            )}
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-200 truncate max-w-[200px]">
              {workshop.name}
            </span>
          </div>

          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
            Portal Oficial de Taller
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-6">
        {/* Professional Workshop Identity Card */}
        <WorkshopProfileCard workshop={workshop} />

        {/* Vehicle Plate Search Box */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Consulta de Ficha Digital & Historial
            </span>
            <h3 className="text-base font-black text-white mt-1">
              Ingresa la Placa de tu Vehículo
            </h3>
            <p className="text-xs text-slate-400">
              Consulta el kilometraje, historial de servicios y el plan preventivo recomendado por tu mecánico
            </p>
          </div>

          <form action={searchPlateAction} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                name="plate"
                required
                defaultValue={q || ''}
                placeholder="Ej. PBX-1234 o ABC-0123"
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-center sm:text-left font-mono text-base font-black text-white uppercase placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden tracking-wider shadow-inner"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition active:scale-95 cursor-pointer"
              >
                🔍 Consultar Auto
              </button>
            </div>

            {err && (
              <p className="text-xs font-semibold text-rose-400 text-center">
                ⚠️ {err}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-[10px] text-slate-600">
          <p>
            {workshop.name} • Potenciado por <strong>januscore.pro</strong> • <span className="font-mono">{APP_VERSION}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
