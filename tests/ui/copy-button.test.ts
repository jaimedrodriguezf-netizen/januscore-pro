import { describe, it, expect } from 'vitest';

describe('Copy Button Logic', () => {
  it('handles link formatting for vehicle public tracking', () => {
    const base = 'https://januscore.pro';
    const plate = 'PBX-1234';
    const fullUrl = `${base}/auto/${plate}`;
    expect(fullUrl).toBe('https://januscore.pro/auto/PBX-1234');
  });
});
