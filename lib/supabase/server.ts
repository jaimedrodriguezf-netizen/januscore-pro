import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://wdjpxveqdqmwhcjmsigs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkanB4dmVxZHFtd2hjam1zaWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzMxMTEsImV4cCI6MjEwMzg0OTExMX0.tC5IHTMhrX22AYPLFb6FudZN1dCkikPhIkTfdNqFK4o';

/**
 * Server Supabase client for Server Components, Server Actions, and Route Handlers.
 * In Next.js App Router RSC, `cookies()` is read-only.
 * Session refresh is handled by `middleware.ts`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

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
