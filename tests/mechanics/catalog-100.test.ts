import { describe, it, expect } from 'vitest';
import {
  MASTER_VEHICLE_CATALOG,
  findMaintenanceTemplate,
  getAvailableBrands,
  getModelsByBrand,
} from '@/lib/mechanics/catalog-100';

describe('100 Vehicle OEM Maintenance Master Catalog (SDD/TDD)', () => {
  it('contains at least 100 structured vehicle maintenance templates', () => {
    expect(MASTER_VEHICLE_CATALOG.length).toBeGreaterThanOrEqual(100);
  });

  it('provides available brands list including major market brands', () => {
    const brands = getAvailableBrands();
    expect(brands).toContain('Chevrolet');
    expect(brands).toContain('Toyota');
    expect(brands).toContain('Kia');
    expect(brands).toContain('Hyundai');
    expect(brands).toContain('Renault');
    expect(brands).toContain('Nissan');
    expect(brands).toContain('Suzuki');
    expect(brands).toContain('Great Wall');
    expect(brands).toContain('Chery');
  });

  it('correctly filters models by brand', () => {
    const chevroletModels = getModelsByBrand('Chevrolet');
    expect(chevroletModels.length).toBeGreaterThanOrEqual(10);
    expect(chevroletModels).toContain('Groove 1.5');
    expect(chevroletModels).toContain('Sail 1.5');
    expect(chevroletModels).toContain('D-Max 2.5/3.0 CRDI');
  });

  it('finds maintenance template by brand and model and includes fluid specs', () => {
    const groove = findMaintenanceTemplate('Chevrolet', 'Groove 1.5');
    expect(groove).toBeDefined();
    expect(groove?.engineOil.viscosity).toBe('5W-30');
    expect(groove?.engineOil.spec).toContain('Dexos');
    expect(groove?.intervals.length).toBeGreaterThanOrEqual(8);
  });
});
