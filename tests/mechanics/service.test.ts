import { describe, expect, it } from 'vitest';
import { formatPlate, calculateNextService, isServiceDue } from '@/lib/mechanics/service';

describe('Mechanics Domain Service', () => {
  it('standardizes and sanitizes license plates', () => {
    expect(formatPlate('pbx-1234')).toBe('PBX-1234');
    expect(formatPlate('  pba 9876 ')).toBe('PBA-9876');
    expect(formatPlate('gs-456c')).toBe('GS-456C');
    expect(formatPlate('abc1234')).toBe('ABC-1234');
  });

  it('calculates next service interval for standard oil change (+5,000 km or 3 months)', () => {
    const baseDate = new Date('2026-09-01T10:00:00Z');
    const currentMileage = 45000;

    const next = calculateNextService({
      serviceType: 'oil_change',
      currentMileage,
      serviceDate: baseDate,
    });

    expect(next.nextMileage).toBe(50000);
    expect(next.nextDate.toISOString().slice(0, 10)).toBe('2026-12-01');
  });

  it('calculates next service interval for comprehensive ABC maintenance (+10,000 km or 6 months)', () => {
    const baseDate = new Date('2026-09-01T10:00:00Z');
    const currentMileage = 80000;

    const next = calculateNextService({
      serviceType: 'full_abc',
      currentMileage,
      serviceDate: baseDate,
    });

    expect(next.nextMileage).toBe(90000);
    expect(next.nextDate.toISOString().slice(0, 10)).toBe('2027-03-01');
  });

  it('correctly determines if maintenance is due by mileage or date', () => {
    const nextService = {
      nextMileage: 50000,
      nextDate: new Date('2026-12-01'),
    };

    // Case 1: Within limits
    expect(isServiceDue(48000, new Date('2026-10-01'), nextService)).toBe(false);

    // Case 2: Exceeded mileage
    expect(isServiceDue(50500, new Date('2026-10-01'), nextService)).toBe(true);

    // Case 3: Exceeded date
    expect(isServiceDue(48000, new Date('2026-12-15'), nextService)).toBe(true);
  });
});
