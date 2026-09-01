import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const isSignUp = params.mode === 'signup';

  async function authAction(formData: FormData) {
    'use server';
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();
    const mode = String(formData.get('mode') || 'signin');

    if (!email || !password) {
      redirect(`/login?mode=${mode}&err=Email%20and%20password%20are%20required`);
    }

    const supabase = await createSupabaseServerClient();

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        redirect(`/login?mode=signup&err=${encodeURIComponent(error.message)}`);
      }
      redirect('/login?ok=Account%20created!%20Check%20your%20email%20or%20sign%20in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        redirect(`/login?err=${encodeURIComponent(error.message)}`);
      }
      redirect('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            JanusCore Pro
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            {isSignUp ? 'Create your account' : 'Sign in to Command Center'}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Multi-Tenant Receipt Verification & Invoicing Core
          </p>
        </div>

        {params.err && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {params.err}
          </div>
        )}

        {params.ok && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {params.ok}
          </div>
        )}

        <form action={authAction} className="mt-8 space-y-4">
          <input type="hidden" name="mode" value={isSignUp ? 'signup' : 'signin'} />

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="operator@januscore.pro"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs shadow-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••••••"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs shadow-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {isSignUp ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-neutral-500">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                Sign in
              </Link>
            </p>
          ) : (
            <p>
              Need an account?{' '}
              <Link href="/login?mode=signup" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                Register
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
