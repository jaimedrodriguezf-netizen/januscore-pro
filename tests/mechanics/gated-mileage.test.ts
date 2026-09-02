import { describe, it, expect } from 'vitest';
import { getNextServicePlan } from '@/lib/mechanics/service';

describe('Gated Mileage Incentive Flow', () => {
  it('unlocks customized plan only when valid odometer reading is provided', () => {
    const inputMileage = 82450;
    const targetMilestone = 90000;

    const plan = getNextServicePlan({
      nextMileage: targetMilestone,
      currentMileage: inputMileage,
      brand: 'Chevrolet',
      model: 'Groove',
    });

    expect(plan.milestoneKm).toBe(90000);
    expect(plan.remainingKm).toBe(7550);
    expect(plan.items.length).toBeGreaterThan(0);
  });
});
