import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession } from '../lib/auth';
import { db } from '../db/db';

vi.mock('../db/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a session and set secure cookie', async () => {
    const mockCookies = {
      set: vi.fn(),
    };

    const userId = 'user-123';
    const sessionId = await createSession(userId, mockCookies);

    expect(sessionId).toBeDefined();
    expect(sessionId.length).toBe(36); // UUID length
    expect(db.insert).toHaveBeenCalled();
    expect(mockCookies.set).toHaveBeenCalledWith(
      'janus_session',
      sessionId,
      expect.objectContaining({
        path: '/',
        secure: true,
        httpOnly: true,
      }),
    );
  });
});
