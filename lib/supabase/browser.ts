import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://wdjpxveqdqmwhcjmsigs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkanB4dmVxZHFtd2hjam1zaWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzMxMTEsImV4cCI6MjEwMzg0OTExMX0.tC5IHTMhrX22AYPLFb6FudZN1dCkikPhIkTfdNqFK4o';

/**
 * Browser Supabase client. Use in Client Components. Carries the user's
 * auth cookies via the browser cookie jar, so RLS sees the authenticated
 * user. Session refresh happens automatically through this client.
 */
export function createSupabaseBrowserClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  const url = rawUrl.replace(/\s+/g, '');
  const key = rawKey.replace(/\s+/g, '');

  return createBrowserClient(url, key);
}
