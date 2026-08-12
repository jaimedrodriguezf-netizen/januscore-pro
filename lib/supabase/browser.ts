import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Use in Client Components. Carries the user's
 * auth cookies via the browser cookie jar, so RLS sees the authenticated
 * user. Session refresh happens automatically through this client.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}