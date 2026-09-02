import { describe, it, expect } from 'vitest';
import { getNextServicePlan } from '@/lib/mechanics/service';

describe('Dynamic Mileage Diagnostic Engine', () => {
  it('calculates dynamic recommendations when client enters 85,000 km', () => {
    const plan = getNextServicePlan({
      nextMileage: 90000,
      currentMileage: 85000,
      brand: 'Chevrolet',
      model: 'Groove',
    });

    expect(plan.remainingKm).toBe(5000);
    expect(plan.isOverdue).toBe(false);
  });

  it('triggers overdue alert when client enters 91,000 km for a 90,000 km target', () => {
    const plan = getNextServicePlan({
      nextMileage: 90000,
      currentMileage: 91000,
      brand: 'Chevrolet',
      model: 'Groove',
    });

    expect(plan.remainingKm).toBe(0);
    expect(plan.isOverdue).toBe(true);
  });
});
