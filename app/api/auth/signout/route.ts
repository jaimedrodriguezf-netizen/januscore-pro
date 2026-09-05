import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Use relative Location header to ensure browser resolves redirect relative to its public address bar,
  // avoiding internal container addresses like 0.0.0.0:3000 or localhost:3000 from reverse proxies
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: '/signin',
    },
  });
}
