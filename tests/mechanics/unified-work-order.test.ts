import { describe, it, expect } from 'vitest';
import {
  prepareExpressWorkOrderPayload,
  type ExpressWorkOrderInput,
} from '@/lib/mechanics/intake-flow';

describe('Unified Work Order Express Mode (TDD)', () => {
  const sampleInput: ExpressWorkOrderInput = {
    vehicleId: 'veh-123',
    technicianName: 'Fabricio Pilozo',
    orderNumber: 'OT-0991',
    mileage: 45000,
    items: [
      { name: 'Cambio de aceite sintético 5W-30', spec: '5W-30 dexos1', cost: 45 },
      { name: 'Filtro de aceite', spec: 'Genuino', cost: 8 },
    ],
    recommendations: 'Revisión en 5,000 km.',
  };

  it('prepares a valid express work order payload with auto-calculated next milestone and total cost', () => {
    const payload = prepareExpressWorkOrderPayload(sampleInput);

    expect(payload.vehicleId).toBe('veh-123');
    expect(payload.orderNumber).toBe('OT-0991');
    expect(payload.technicianName).toBe('Fabricio Pilozo');
    expect(payload.mileage).toBe(45000);
    expect(payload.nextMileage).toBe(50000);
    expect(payload.cost).toBe(53);
    expect(payload.selectedOperations).toContain('Servicio Express de Mantenimiento');
    expect(payload.items.length).toBe(2);
  });

  it('uses fallback orderNumber when omitted', () => {
    const payload = prepareExpressWorkOrderPayload({
      ...sampleInput,
      orderNumber: undefined,
    });

    expect(payload.orderNumber).toBeDefined();
    expect(payload.orderNumber.length).toBeGreaterThan(0);
  });
});
