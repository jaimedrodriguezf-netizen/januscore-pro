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

  async function handleGoogleSignIn() {
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setErrorMsg(msg);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
          Plataforma de Gestión Automotriz & Control de Negocios
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

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white py-2.5 px-4 text-xs font-bold text-neutral-800 shadow-xs hover:bg-neutral-50 transition active:scale-[0.99] disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.28 21.43 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.41l4.03-3.13z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.28 2.57 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
          />
        </svg>
        <span>Continuar con Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        <span className="bg-white px-3 text-[11px] font-medium text-neutral-400 dark:bg-neutral-900 absolute">
          o ingresa con tu correo
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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
