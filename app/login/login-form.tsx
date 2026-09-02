'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { APP_VERSION } from '@/lib/version';

interface LoginFormProps {
  initialMode: string;
  initialError: string | null;
  initialSuccess: string | null;
}

export function LoginForm({ initialMode, initialError, initialSuccess }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode === 'signup' ? 'signup' : 'signin');
  const isSignUp = mode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialSuccess);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          // Hard navigation to refresh server session state
          window.location.href = '/';
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor de autenticación';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            JanusCore Pro
          </span>
          <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300">
            {APP_VERSION}
          </span>
        </div>
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
            name="email"
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
            name="password"
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
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Inicia sesión
            </button>
          </p>
        ) : (
          <p>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Regístrate
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
