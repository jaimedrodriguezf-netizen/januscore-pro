import { MASTER_VEHICLE_CATALOG } from './catalog-100';
import {
  type MaintenanceTemplate,
  generateStandardIntervals,
} from './maintenance-templates';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate that a custom template has all required metadata and specifications.
 */
export function validateCustomTemplate(
  template: Partial<MaintenanceTemplate>
): ValidationResult {
  const errors: string[] = [];

  if (!template.brand || !template.brand.trim()) {
    errors.push('Marca es obligatoria');
  }

  if (!template.model || !template.model.trim()) {
    errors.push('Modelo es obligatorio');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Merge tenant/custom user templates with the master 100+ OEM catalog.
 */
export function mergeCustomTemplatesWithMaster(
  customTemplates: MaintenanceTemplate[] = []
): MaintenanceTemplate[] {
  const customIds = new Set(customTemplates.map((c) => c.id));
  const filteredMaster = MASTER_VEHICLE_CATALOG.filter((m) => !customIds.has(m.id));

  return [...customTemplates, ...filteredMaster];
}

/**
 * Helper to build a complete custom maintenance template with standard intervals if omitted.
 */
export function buildCustomTemplate(
  data: Partial<MaintenanceTemplate>
): MaintenanceTemplate {
  const brand = (data.brand || 'Personalizada').trim();
  const model = (data.model || 'Vehículo').trim();
  const viscosity = data.engineOil?.viscosity || '5W-30';
  const sparkPlug = data.sparkPlugs?.spec || 'Iridio / Níquel';

  const intervals =
    data.intervals && data.intervals.length > 0
      ? data.intervals
      : generateStandardIntervals(viscosity, sparkPlug);

  return {
    id: data.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    brand,
    model,
    generationYears: data.generationYears || new Date().getFullYear().toString(),
    engineDisplacement: data.engineDisplacement || '1.5L - 2.0L',
    fuelType: data.fuelType || 'gasoline',
    engineOil: {
      viscosity,
      spec: data.engineOil?.spec || 'API SP / ILSAC GF-6',
      capacityLiters: data.engineOil?.capacityLiters || 4.0,
    },
    sparkPlugs: data.sparkPlugs || {
      type: 'Iridio',
      spec: sparkPlug,
      intervalKm: 40000,
    },
    brakeFluid: data.brakeFluid || 'DOT 4',
    coolant: data.coolant || 'OAT Larga Duración 50/50',
    transmissionFluid: data.transmissionFluid,
    intervals,
    isCustom: true,
    notes: data.notes,
  };
}
