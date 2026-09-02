import { describe, it, expect } from 'vitest';
import { formatPlate } from '@/lib/mechanics/service';

describe('Public Plate Search Formatter', () => {
  it('formats lowercase and unhyphenated plates for search', () => {
    expect(formatPlate('pbx1234')).toBe('PBX-1234');
    expect(formatPlate('pba-0987')).toBe('PBA-0987');
  });
});
