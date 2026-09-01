import { describe, it, expect } from 'vitest';
import { APP_VERSION, BUILD_NUMBER, BUILD_TIMESTAMP } from '@/lib/version';

describe('Version System', () => {
  it('exports a valid semver APP_VERSION with v prefix', () => {
    expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('exports a matching BUILD_NUMBER without v prefix', () => {
    expect(BUILD_NUMBER).toMatch(/^\d+\.\d+\.\d+$/);
    expect(`v${BUILD_NUMBER}`).toBe(APP_VERSION);
  });

  it('exports a valid ISO timestamp for BUILD_TIMESTAMP', () => {
    const parsed = new Date(BUILD_TIMESTAMP);
    expect(parsed.getTime()).not.toBeNaN();
  });
});
