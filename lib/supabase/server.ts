import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client (App Router server components / route handlers /
 * server actions). Carries the user's auth cookies, so RLS sees the real
 * authenticated user — use this for all user-driven reads/writes.
 *
 * `getAll` reads from the request cookies; `setAll` best-effort writes back
 * (succeeds in server actions / route handlers, no-ops in pure RSC where the
 * cookie store is readonly). Session refresh is handled by middleware.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Called from a Server Component where cookies are readonly.
              // Refresh is handled by middleware; safe to ignore here.
            }
          });
        },
      },
    },
  );
}