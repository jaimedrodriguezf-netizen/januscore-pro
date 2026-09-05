import { describe, it, expect } from 'vitest';
import {
  calculateWorkOrderTotals,
  formatWorkOrderDescription,
  type WorkOrderItem,
  type WorkOrderPayload,
} from '@/lib/mechanics/work-order';

describe('Workshop Work Order Domain & Form (SDD/TDD)', () => {
  it('calculates total correctly from dynamic items and parts', () => {
    const items: WorkOrderItem[] = [
      { name: 'Cambio de aceite de motor', spec: 'PETRONAS 5W30 DEXOS 1 GEN 3', cost: 50.00 },
      { name: 'Bujías de iridio', spec: 'IRIDIO DENSO IXU22', cost: 47.00 },
      { name: 'Filtro de aire de motor', cost: 8.25 },
      { name: 'Filtro de aire acondicionado', cost: 7.00 },
      { name: 'Filtro de combustible', cost: 7.00 },
      { name: 'Supresores de bobina (2)', cost: 30.00 },
      { name: 'Mano de obra y diagnóstico', cost: 11.75 },
    ];

    const totals = calculateWorkOrderTotals(items);
    expect(totals.subtotal).toBe(161.00);
    expect(totals.total).toBe(161.00);
  });

  it('formats structured work order description with technical specs and operations', () => {
    const payload: Partial<WorkOrderPayload> = {
      orderNumber: '01127',
      technicianName: 'Fabricio Pilozo',
      selectedOperations: ['Cambio de aceite', 'Cambio de filtro de aire', 'Revisión/Cambio de bujías'],
      items: [
        { name: 'Cambio de aceite de motor', spec: 'PETRONAS 5W30 DEXOS 1 GEN 3', cost: 50.00 },
        { name: 'Bujías de iridio', spec: 'IRIDIO DENSO IXU22', cost: 47.00 },
      ],
      recommendations: 'Se recomienda realizar reajuste de suspensión y ABC de frenos a los 70,000 km.',
    };

    const description = formatWorkOrderDescription(payload);
    expect(description).toContain('Orden N: 01127');
    expect(description).toContain('PETRONAS 5W30');
    expect(description).toContain('IRIDIO DENSO');
    expect(description).toContain('Fabricio Pilozo');
    expect(description).not.toContain('$');
    expect(description).not.toContain('50.00');
  });
});
