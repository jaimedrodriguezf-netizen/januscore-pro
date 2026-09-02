import { describe, it, expect } from 'vitest';
import { getNextServicePlan } from '@/lib/mechanics/service';

describe('Next Service Plan Generator', () => {
  it('generates recommended maintenance checklist for 90,000 km', () => {
    const plan = getNextServicePlan({
      nextMileage: 90000,
      currentMileage: 80000,
      brand: 'Chevrolet',
      model: 'Groove',
    });

    expect(plan.milestoneKm).toBe(90000);
    expect(plan.items.length).toBeGreaterThan(2);
    expect(plan.items.some(i => i.toLowerCase().includes('aceite'))).toBe(true);
    expect(plan.remainingKm).toBe(10000);
  });

  it('flags service as due when current mileage meets or exceeds next mileage', () => {
    const plan = getNextServicePlan({
      nextMileage: 80000,
      currentMileage: 80500,
    });

    expect(plan.isOverdue).toBe(true);
    expect(plan.remainingKm).toBe(0);
  });
});
