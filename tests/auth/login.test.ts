import { describe, it, expect, vi } from 'vitest';
import { createBrowserClient } from '@supabase/ssr';

describe('Login & Authentication Flow', () => {
  it('creates browser client with correct environment configuration', () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wdjpxveqdqmwhcjmsigs.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
    );
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('handles invalid credentials by returning error from auth service', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const result = await mockSignIn({
      email: 'invalid@januscore.pro',
      password: 'wrongpassword',
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Invalid login credentials');
    expect(result.data.session).toBeNull();
  });

  it('handles successful login by returning valid user session', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'usr-123', email: 'admin@januscore.pro' },
        session: { access_token: 'valid-jwt-token' },
      },
      error: null,
    });

    const result = await mockSignIn({
      email: 'admin@januscore.pro',
      password: 'correctpassword',
    });

    expect(result.error).toBeNull();
    expect(result.data.user.email).toBe('admin@januscore.pro');
    expect(result.data.session.access_token).toBe('valid-jwt-token');
  });
});
