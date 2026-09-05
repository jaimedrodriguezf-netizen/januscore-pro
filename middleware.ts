import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { rateLimiter } from '@/lib/security/rate-limit';

const DEFAULT_SUPABASE_URL = 'https://wdjpxveqdqmwhcjmsigs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkanB4dmVxZHFtd2hjam1zaWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzMxMTEsImV4cCI6MjEwMzg0OTExMX0.tC5IHTMhrX22AYPLFb6FudZN1dCkikPhIkTfdNqFK4o';

const BLOCKED_BOT_AGENTS = [
  'sqlmap',
  'nikto',
  'masscan',
  'nmap',
  'zgrab',
  'dirbuster',
  'gobuster',
  'wpscan',
];

function getClientIp(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xReal = request.headers.get('x-real-ip');
  if (xReal) return xReal.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const clientIp = getClientIp(request);

  // 1. Block known malicious automated vulnerability scanners
  if (BLOCKED_BOT_AGENTS.some((bot) => userAgent.includes(bot))) {
    return new NextResponse('Acceso denegado: Bot scanner no permitido', { status: 403 });
  }

  // 2. IP Rate Limiting against Bot Scraping & Brute Force
  let limit = 120; // Default: 120 req / min
  const windowMs = 60_000;

  if (pathname.startsWith('/login') || pathname.startsWith('/signin') || pathname.startsWith('/api/auth')) {
    limit = 30; // Auth: 30 req / min to prevent credential stuffing / brute force
  } else if (pathname.startsWith('/auto') || pathname.startsWith('/m/')) {
    limit = 60; // Public vehicle lookup: 60 req / min to prevent plate scraping
  } else if (pathname.startsWith('/api/')) {
    limit = 100; // API endpoints: 100 req / min
  }

  const rateLimitResult = rateLimiter.check(`${clientIp}:${pathname.split('/')[1] || 'root'}`, limit, windowMs);
  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Demasiadas solicitudes desde tu IP. Por favor espera un momento.',
        code: 'RATE_LIMIT_EXCEEDED',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': '60',
        },
      }
    );
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Inject defense-in-depth security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  const url = rawUrl.replace(/\s+/g, '');
  const key = rawKey.replace(/\s+/g, '');

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshes session token if expired and sets updated cookies on response headers
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
