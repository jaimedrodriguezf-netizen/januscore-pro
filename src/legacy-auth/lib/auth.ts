import { db } from '../db/db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { AstroCookies } from 'astro';

export const SESSION_COOKIE_NAME = 'janus_session';

export async function createSession(userId: string, cookies: AstroCookies) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  cookies.set(SESSION_COOKIE_NAME, sessionId, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    expires: expiresAt,
  });

  return sessionId;
}

export async function validateSession(token: string) {
  if (!token) return null;

  const result = await db
    .select({
      session: sessions,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { session, user } = result[0];

  if (Date.now() >= session.expiresAt.getTime()) {
    // Session expired, delete it
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }

  // Extend session if it has less than 15 days remaining
  const fifteenDays = 1000 * 60 * 60 * 24 * 15;
  if (session.expiresAt.getTime() - Date.now() < fifteenDays) {
    const nextExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(sessions)
      .set({ expiresAt: nextExpiresAt })
      .where(eq(sessions.id, token));
  }

  return user;
}

export async function destroySession(token: string, cookies: AstroCookies) {
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/',
  });
}
