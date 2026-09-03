import { describe, it, expect } from 'vitest';
import {
  validateCustomTemplate,
  mergeCustomTemplatesWithMaster,
} from '@/lib/mechanics/template-service';
import type { MaintenanceTemplate } from '@/lib/mechanics/maintenance-templates';

describe('Custom Maintenance Template Service (SDD/TDD)', () => {
  it('validates required fields of a custom maintenance sheet', () => {
    const validPayload: Partial<MaintenanceTemplate> = {
      brand: 'BYD',
      model: 'Song Plus DM-i',
      generationYears: '2023-2025',
      engineDisplacement: '1.5L Híbrido Enchufable',
      fuelType: 'hybrid',
      engineOil: { viscosity: '0W-20', spec: 'API SP / ILSAC GF-6', capacityLiters: 4.0 },
      brakeFluid: 'DOT 4',
      coolant: 'OAT Azul',
    };

    const validation = validateCustomTemplate(validPayload);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('rejects incomplete custom templates with clear error messages', () => {
    const invalidPayload: Partial<MaintenanceTemplate> = {
      brand: '',
      model: '',
    };

    const validation = validateCustomTemplate(invalidPayload);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Marca es obligatoria');
    expect(validation.errors).toContain('Modelo es obligatorio');
  });

  it('merges custom user templates on top of the 100+ master OEM catalog', () => {
    const customTemplate: MaintenanceTemplate = {
      id: 'custom-byd-song',
      brand: 'BYD',
      model: 'Song Plus DM-i',
      generationYears: '2024',
      engineDisplacement: '1.5L DM-i',
      fuelType: 'hybrid',
      engineOil: { viscosity: '0W-20', spec: 'API SP', capacityLiters: 4.0 },
      brakeFluid: 'DOT 4',
      coolant: 'Azul',
      intervals: [],
      isCustom: true,
    };

    const merged = mergeCustomTemplatesWithMaster([customTemplate]);
    expect(merged.length).toBeGreaterThan(100);
    expect(merged.some((t) => t.id === 'custom-byd-song')).toBe(true);
  });
});
