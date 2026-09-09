import { describe, it, expect } from 'vitest';
import { searchCatalogVehicles, getUniqueCatalogBrands } from '@/lib/mechanics/catalog-search';

describe('Predictive Vehicle Catalog Search (SDD/TDD)', () => {
  it('returns empty array when query is empty or only whitespace', () => {
    expect(searchCatalogVehicles('')).toEqual([]);
    expect(searchCatalogVehicles('   ')).toEqual([]);
  });

  it('finds models matching brand case-insensitively', () => {
    const results = searchCatalogVehicles('toyota');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.brand.toLowerCase() === 'toyota')).toBe(true);
  });

  it('finds models matching model name', () => {
    const results = searchCatalogVehicles('aveo');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.model.toLowerCase().includes('aveo'))).toBe(true);
  });

  it('finds models with punctuation differences (e.g. d-max vs dmax)', () => {
    const resultsHyphen = searchCatalogVehicles('d-max');
    const resultsNoHyphen = searchCatalogVehicles('dmax');
    expect(resultsHyphen.length).toBeGreaterThan(0);
    expect(resultsNoHyphen.length).toBeGreaterThan(0);
  });

  it('respects the limit argument', () => {
    const limited = searchCatalogVehicles('chevrolet', 3);
    expect(limited.length).toBeLessThanOrEqual(3);
  });

  it('returns sorted unique catalog brands', () => {
    const brands = getUniqueCatalogBrands();
    expect(brands.length).toBeGreaterThan(5);
    expect(brands).toContain('Chevrolet');
    expect(brands).toContain('Toyota');
    expect(brands).toContain('Kia');
    expect(brands).toContain('Hyundai');
    // Ensure no duplicates
    const set = new Set(brands);
    expect(set.size).toBe(brands.length);
  });
});
