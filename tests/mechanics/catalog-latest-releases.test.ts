import { describe, it, expect } from 'vitest';
import {
  MASTER_VEHICLE_CATALOG,
  findMaintenanceTemplate,
} from '@/lib/mechanics/catalog-100';

describe('2024-2026 Latest Vehicle Releases & Photo URLs (SDD/TDD)', () => {
  it('includes 2024-2026 latest releases in Ecuador/Latam', () => {
    const yarisCross = findMaintenanceTemplate('Toyota', 'Yaris Cross');
    expect(yarisCross).toBeDefined();
    expect(yarisCross?.generationYears).toContain('2024');

    const bydSong = findMaintenanceTemplate('BYD', 'Song Plus');
    expect(bydSong).toBeDefined();
    expect(bydSong?.fuelType).toBe('hybrid');

    const montana = findMaintenanceTemplate('Chevrolet', 'Montana');
    expect(montana).toBeDefined();

    const tank300 = findMaintenanceTemplate('Great Wall', 'Tank 300');
    expect(tank300).toBeDefined();
  });

  it('provides image URLs for vehicle cards with high quality automotive visual references', () => {
    const groove = findMaintenanceTemplate('Chevrolet', 'Groove 1.5');
    expect(groove?.imageUrl).toBeDefined();
    expect(groove?.imageUrl).toContain('http');
  });
});
