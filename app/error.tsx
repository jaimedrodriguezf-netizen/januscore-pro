'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App ErrorBoundary caught error]:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          ⚠️
        </div>
        <h2 className="text-base font-bold text-slate-100">Error en la vista</h2>
        <p className="text-xs text-slate-400">
          No se pudo cargar la sección solicitada. Podés intentar recargarla.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
