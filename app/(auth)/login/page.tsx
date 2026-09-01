'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const isSignUp = mode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(searchParams.get('err') || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(searchParams.get('ok') || null);

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
          router.push('/login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          // Success: Navigate to hub
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al conectar con el servidor';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          JanusCore Pro
        </span>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          {isSignUp ? 'Crear cuenta' : 'Ingresar a JanusCore Pro'}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Plataforma de Verificación de Pagos & Gestión Automotriz
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Correo Electrónico
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@januscore.pro"
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs shadow-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs shadow-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {loading ? 'Procesando...' : isSignUp ? 'Registrar Cuenta' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-neutral-500">
        {isSignUp ? (
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              Inicia sesión
            </Link>
          </p>
        ) : (
          <p>
            ¿No tienes cuenta?{' '}
            <Link href="/login?mode=signup" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              Regístrate
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={<div className="text-xs text-neutral-400">Cargando...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
