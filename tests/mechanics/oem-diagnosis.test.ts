import { describe, it, expect } from 'vitest';
import { getNextServicePlan } from '@/lib/mechanics/service';
import { transformOemPlanToWorkOrderItems } from '@/lib/mechanics/intake-flow';
import type { Vehicle } from '@/lib/mechanics/types';

describe('OEM Service Diagnosis & Work Order Integration (TDD)', () => {
  const sampleVehicle: Vehicle = {
    id: 'veh-100',
    tenant_id: 'ten-1',
    plate: 'PBX-1234',
    brand: 'Chevrolet',
    model: 'D-Max',
    year: 2022,
    current_mileage: 39500,
    owner_name: 'Jaime R.',
    owner_phone: '0991234567',
    owner_identification: '0923456789',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('computes next milestone diagnosis for incoming vehicle at 39,500 km', () => {
    // Current is 39,500 km -> next regular service is 40,000 km (Mantenimiento Mayor)
    const plan = getNextServicePlan({
      currentMileage: sampleVehicle.current_mileage,
      nextMileage: 40000,
      brand: sampleVehicle.brand,
      model: sampleVehicle.model,
    });

    expect(plan.milestoneKm).toBe(40000);
    expect(plan.typeBadge).toBe('Mantenimiento Mayor');
    expect(plan.remainingKm).toBe(500);
    expect(plan.items.length).toBeGreaterThan(3);
    expect(plan.fluidSpecs.length).toBeGreaterThan(1);
  });

  it('converts OEM diagnosis into items and preserves fluid specifications for the work order', () => {
    const plan = getNextServicePlan({
      currentMileage: sampleVehicle.current_mileage,
      nextMileage: 40000,
      brand: sampleVehicle.brand,
      model: sampleVehicle.model,
    });

    const workOrderItems = transformOemPlanToWorkOrderItems(plan);

    expect(workOrderItems.length).toBeGreaterThanOrEqual(plan.items.length);
    const oilItem = workOrderItems.find((i) => i.name.toLowerCase().includes('aceite'));
    expect(oilItem).toBeDefined();
    expect(oilItem?.spec).toContain('5W-30');
  });
});
