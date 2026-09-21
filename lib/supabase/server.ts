import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'http://localhost:54321';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

/**
 * Server Supabase client for Server Components, Server Actions, and Route Handlers.
 * In Next.js App Router RSC, `cookies()` is read-only.
 * Session refresh is handled by `middleware.ts`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  const url = rawUrl.replace(/\s+/g, '');
  const key = rawKey.replace(/\s+/g, '');

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing sessions.
        }
      },
    },
  });
}
