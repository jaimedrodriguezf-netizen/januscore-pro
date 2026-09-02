import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatPlate } from '@/lib/mechanics/service';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export default async function PublicPlateSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ plate?: string }>;
}) {
  const params = await searchParams;

  async function searchPlateAction(formData: FormData) {
    'use server';
    const rawPlate = String(formData.get('plate') || '');
    const cleanPlate = formatPlate(rawPlate);

    if (cleanPlate) {
      redirect(`/auto/${encodeURIComponent(cleanPlate)}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 font-sans antialiased">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-2xl shadow-inner">
            🚗
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-100">
            Consulta de Ficha Vehicular
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Ingresa la placa de tu auto para ver el historial de servicios y fecha de tu próximo mantenimiento
          </p>
        </div>

        {/* Search Form */}
        <form action={searchPlateAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-300">
              Número de Placa
            </label>
            <div className="mt-2 relative">
              <input
                type="text"
                name="plate"
                required
                defaultValue={params.plate || ''}
                placeholder="EJ. PBX-1234"
                className="block w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3.5 text-center font-mono text-xl font-black uppercase tracking-widest text-white placeholder-slate-500 shadow-inner focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-slate-500">
              Acepta formatos como <span className="font-mono text-slate-400">PBX-1234</span> o <span className="font-mono text-slate-400">PBX1234</span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-indigo-500 active:scale-[0.99] transition"
          >
            Consultar Historial →
          </button>
        </form>

        {/* Info Badge */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
          <p className="text-[11px] text-slate-400">
            🔒 Consulta pública directa sin necesidad de registrarte ni crear contraseñas.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition"
          >
            ← Volver al Portal Principal
          </Link>
          <div className="mt-4 text-[10px] text-slate-600">
            JanusCore Pro Auto Service • <span className="font-mono">{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
