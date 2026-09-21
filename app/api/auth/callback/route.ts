import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next') ?? '/';
  const isSafeRelative =
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.startsWith('/\\') &&
    !rawNext.includes('://');
  const targetPath = isSafeRelative ? rawNext : '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location: targetPath,
        },
      });
    }
  }

  // If code exchange failed or was not provided
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: '/signin?err=No%20se%20pudo%20completar%20la%20autenticaci%C3%B3n%20con%20Google',
    },
  });
}
