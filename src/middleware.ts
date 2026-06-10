import { defineMiddleware } from 'astro:middleware';
import { validateSession, SESSION_COOKIE_NAME } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionToken = context.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const user = await validateSession(sessionToken);
    if (user) {
      context.locals.user = user;
    } else {
      context.locals.user = null;
      context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    }
  } else {
    context.locals.user = null;
  }

  const url = new URL(context.request.url);

  // Route Protection Rules
  // 1. Protect Dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    if (!context.locals.user) {
      return context.redirect('/login');
    }
  }

  // 2. Redirect authenticated users away from Login and Register pages
  if (url.pathname === '/login' || url.pathname === '/register') {
    if (context.locals.user) {
      return context.redirect('/dashboard');
    }
  }

  return next();
});
