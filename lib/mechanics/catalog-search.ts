import { MASTER_VEHICLE_CATALOG } from './catalog-100';

export interface CatalogVehicleItem {
  id: string;
  brand: string;
  model: string;
  generationYears?: string;
  engineDisplacement?: string;
  fuelType?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Predictive search across master OEM vehicle catalog templates.
 * Matches brand, model, generation years, and normalized strings.
 */
export function searchCatalogVehicles(
  query: string,
  limit: number = 10
): CatalogVehicleItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normQuery = normalizeText(trimmed);

  const matched = MASTER_VEHICLE_CATALOG.filter((item) => {
    const normBrand = normalizeText(item.brand);
    const normModel = normalizeText(item.model);
    const normYears = normalizeText(item.generationYears || '');
    const normFull = `${normBrand}${normModel}`;

    return (
      normBrand.includes(normQuery) ||
      normModel.includes(normQuery) ||
      normFull.includes(normQuery) ||
      normYears.includes(normQuery)
    );
  });

  return matched.slice(0, limit).map((item) => ({
    id: item.id,
    brand: item.brand,
    model: item.model,
    generationYears: item.generationYears,
    engineDisplacement: item.engineDisplacement,
    fuelType: item.fuelType,
  }));
}

/**
 * Returns sorted unique vehicle brands from the master catalog.
 */
export function getUniqueCatalogBrands(): string[] {
  const brandsSet = new Set<string>();
  for (const item of MASTER_VEHICLE_CATALOG) {
    if (item.brand) {
      brandsSet.add(item.brand.trim());
    }
  }
  return Array.from(brandsSet).sort((a, b) => a.localeCompare(b));
}
