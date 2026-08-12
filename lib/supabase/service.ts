import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. **Bypasses RLS** — must NEVER be reachable
 * from a user request path without an explicit privilege check. Reserved for
 * trusted background jobs (OCR, QR verification, audit writes) and admin
 * bootstrap scripts. The service role key is server-only and MUST NOT be
 * exposed to the browser (it has no NEXT_PUBLIC_ prefix on purpose).
 */
export function createSupabaseServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for the service client. ' +
        'Ensure it is only available server-side (never NEXT_PUBLIC_).',
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}