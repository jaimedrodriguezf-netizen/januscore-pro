'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            ⚠️
          </div>
          <h2 className="text-base font-bold text-slate-100">Algo no salió como esperábamos</h2>
          <p className="text-xs text-slate-400">
            Ocurrió un error inesperado al procesar la solicitud. Nuestro equipo técnico fue notificado.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono text-rose-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all text-left">
              {error.message}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
