import { describe, it, expect } from 'vitest';
import { isModuleAllowedForBusinessType } from '@/lib/tenancy/guard';

describe('Business Type Module Guard (isModuleAllowedForBusinessType)', () => {
  it('allows all modules when businessType is "all"', () => {
    expect(isModuleAllowedForBusinessType('all', 'workshop')).toBe(true);
    expect(isModuleAllowedForBusinessType('all', 'financial_receipts')).toBe(true);
    expect(isModuleAllowedForBusinessType('all', 'admin')).toBe(true);
  });

  it('allows workshop and admin but denies financial_receipts when businessType is "mechanics"', () => {
    expect(isModuleAllowedForBusinessType('mechanics', 'workshop')).toBe(true);
    expect(isModuleAllowedForBusinessType('mechanics', 'admin')).toBe(true);
    expect(isModuleAllowedForBusinessType('mechanics', 'financial_receipts')).toBe(false);
  });

  it('allows financial_receipts and admin but denies workshop when businessType is "financial_receipts"', () => {
    expect(isModuleAllowedForBusinessType('financial_receipts', 'financial_receipts')).toBe(true);
    expect(isModuleAllowedForBusinessType('financial_receipts', 'admin')).toBe(true);
    expect(isModuleAllowedForBusinessType('financial_receipts', 'workshop')).toBe(false);
  });
});
