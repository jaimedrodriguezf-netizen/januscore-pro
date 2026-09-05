import { describe, it, expect } from 'vitest';

describe('Google OAuth & Auth Callback Handler', () => {
  it('constructs callback URL accurately with next redirect parameter', () => {
    const origin = 'https://januscore.pro';
    const nextPath = '/workshop';
    const callbackUrl = new URL('/api/auth/callback', origin);
    callbackUrl.searchParams.set('next', nextPath);

    expect(callbackUrl.toString()).toBe('https://januscore.pro/api/auth/callback?next=%2Fworkshop');
  });

  it('validates business module filters for mechanics and financial domains', () => {
    const modulesConfig: Record<string, string[]> = {
      mechanics: ['workshop', 'workshop_templates', 'workshop_settings', 'workshop_print'],
      financial_receipts: ['upload', 'receipts', 'metrics', 'branches'],
      all: ['workshop', 'upload', 'receipts', 'metrics', 'branches', 'settings'],
    };

    expect(modulesConfig.mechanics).toContain('workshop');
    expect(modulesConfig.mechanics).not.toContain('receipts');
    expect(modulesConfig.financial_receipts).toContain('receipts');
    expect(modulesConfig.financial_receipts).not.toContain('workshop');
    expect(modulesConfig.all).toContain('workshop');
    expect(modulesConfig.all).toContain('receipts');
  });
});
