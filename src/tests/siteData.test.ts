import { describe, it, expect } from 'vitest';
import { siteData } from '../data/siteData';

describe('Site Configuration', () => {
  it('should load site data correctly', () => {
    expect(siteData.name).toBe('Janus Core');
    expect(siteData.language).toBe('es');
  });
});
