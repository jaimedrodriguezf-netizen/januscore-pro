import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'http://localhost:54321';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

/**
 * Browser Supabase client. Use in Client Components. Carries the user's
 * auth cookies via the browser cookie jar, so RLS sees the authenticated
 * user. Session refresh happens automatically through this client.
 */
export function createSupabaseBrowserClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  const url = rawUrl.replace(/\s+/g, '');
  const key = rawKey.replace(/\s+/g, '');

  return createBrowserClient(url, key);
}
