import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceType, NextServiceCalculation } from './types';

/**
 * Standardize vehicle plate format (e.g. "pbx1234" -> "PBX-1234", "gs-456c" -> "GS-456C").
 */
export function formatPlate(rawPlate: string): string {
  const trimmed = (rawPlate || '').trim().toUpperCase();
  
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => p.trim());
    return parts.join('-');
  }

  const cleaned = trimmed.replace(/[^A-Z0-9]/g, '');
  
  // Match standard 2 or 3 letters followed by 3 or 4 numbers / suffix
  const match = cleaned.match(/^([A-Z]{2,3})([0-9]{3,4}[A-Z]?)$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }

  return cleaned;
}

/**
 * Calculate recommended next service mileage and date.
 */
export function calculateNextService(params: {
  serviceType: ServiceType;
  currentMileage: number;
  serviceDate: Date;
}): NextServiceCalculation {
  const { serviceType, currentMileage, serviceDate } = params;
  const nextDate = new Date(serviceDate.getTime());

  let deltaMileage = 5000; // default 5,000 km
  let deltaMonths = 3;     // default 3 months

  switch (serviceType) {
    case 'oil_change':
      deltaMileage = 5000;
      deltaMonths = 3;
      break;
    case 'brakes':
    case 'suspension':
    case 'full_abc':
      deltaMileage = 10000;
      deltaMonths = 6;
      break;
    case 'alignment_balancing':
      deltaMileage = 5000;
      deltaMonths = 6;
      break;
    case 'general_repair':
    default:
      deltaMileage = 5000;
      deltaMonths = 3;
      break;
  }

  nextDate.setMonth(nextDate.getMonth() + deltaMonths);

  return {
    nextMileage: currentMileage + deltaMileage,
    nextDate,
  };
}

/**
 * Infers valid PostgreSQL ServiceType from explicit input, operations, or items.
 */
export function inferServiceType(
  rawServiceType?: string | null,
  operations: string[] = [],
  items: { name: string; spec?: string }[] = []
): ServiceType {
  const validTypes: ServiceType[] = [
    'oil_change',
    'brakes',
    'suspension',
    'full_abc',
    'alignment_balancing',
    'general_repair',
  ];

  if (rawServiceType && validTypes.includes(rawServiceType as ServiceType)) {
    return rawServiceType as ServiceType;
  }

  const allText = [...operations, ...items.map((i) => `${i.name} ${i.spec || ''}`)]
    .join(' ')
    .toLowerCase();

  if (
    allText.includes('abc') ||
    (allText.includes('aceite') && (allText.includes('freno') || allText.includes('bujía') || allText.includes('bujia')))
  ) {
    return 'full_abc';
  }
  if (allText.includes('freno') || allText.includes('pastilla') || allText.includes('disco')) {
    return 'brakes';
  }
  if (allText.includes('suspensi') || allText.includes('amortiguador') || allText.includes('rótula') || allText.includes('rotula')) {
    return 'suspension';
  }
  if (allText.includes('alineaci') || allText.includes('balanceo')) {
    return 'alignment_balancing';
  }
  if (allText.includes('aceite') || allText.includes('filtro')) {
    return 'oil_change';
  }

  return 'general_repair';
}


/**
 * Check if maintenance is due or overdue based on current vehicle status.
 */
export function isServiceDue(
  currentMileage: number,
  currentDate: Date,
  nextService: { nextMileage?: number; nextDate?: Date | string },
): boolean {
  if (nextService.nextMileage && currentMileage >= nextService.nextMileage) {
    return true;
  }
  if (nextService.nextDate) {
    const targetDate = typeof nextService.nextDate === 'string' 
      ? new Date(nextService.nextDate) 
      : nextService.nextDate;
    if (currentDate.getTime() >= targetDate.getTime()) {
      return true;
    }
  }
  return false;
}

export interface NextServicePlan {
  title: string;
  milestoneKm: number;
  remainingKm: number;
  isOverdue: boolean;
  typeBadge: string;
  items: string[];
  fluidSpecs: string[];
  recommendation: string;
}

/**
 * Generate detailed checklist and work breakdown for the upcoming maintenance.
 */
export function getNextServicePlan(params: {
  nextMileage?: number;
  currentMileage: number;
  nextDate?: Date | string;
  brand?: string;
  model?: string;
}): NextServicePlan {
  const { nextMileage = params.currentMileage + 5000, currentMileage, brand = '', model = '' } = params;
  const remainingKm = Math.max(0, nextMileage - currentMileage);
  const isOverdue = currentMileage >= nextMileage;

  // Determine milestone tier (e.g. 10k, 20k, 40k, 60k, 80k, 90k, 100k)
  const isMajor100k = nextMileage % 100000 === 0;
  const isMajor40k = nextMileage % 40000 === 0;
  const isIntermediate20k = nextMileage % 20000 === 0;

  const vehicleSuffix = brand && model ? ` - ${brand} ${model}` : '';
  let title = `Mantenimiento Preventivo (${nextMileage.toLocaleString()} km)${vehicleSuffix}`;
  let typeBadge = 'Preventivo Regular';
  let items: string[] = [
    'Cambio de aceite de motor sintético 100% de alta graduación',
    'Reemplazo de filtro de aceite de motor genuino',
    'Reemplazo de filtro de aire de motor',
    'Rotación, calibración y balanceo de neumáticos',
    'Inspección de 25 puntos de seguridad (frenos, suspensión, luces y niveles)',
  ];
  let fluidSpecs: string[] = [
    'Aceite: Sintético 5W-30 (dexos1 Gen3 / API SP)',
    'Fluidos: Revisión de nivel de refrigerante, líquido de frenos y dirección',
  ];
  let recommendation = 'Te recomendamos realizar este servicio preventivo para mantener la garantía y máxima eficiencia de combustible.';

  if (isMajor100k || isMajor40k) {
    typeBadge = 'Mantenimiento Mayor';
    title = `Mantenimiento Mayor Programado (${nextMileage.toLocaleString()} km)`;
    items = [
      'ABC de Motor Integral y diagnóstico computarizado con escáner OBD2',
      'Cambio de aceite sintético 5W-30 + filtro de aceite y filtro de aire',
      'Reemplazo de filtro de cabina de A/C (polen con carbón activado)',
      'Cambio de juego de bujías de encendido de alto rendimiento',
      'Purga completa y cambio de líquido de frenos DOT 4',
      'ABC de frenos (limpieza, rectificación o cambio de pastillas y zapatas)',
      'Inspección y tensión de correa de accesorios / alternador',
    ];
    fluidSpecs = [
      'Aceite de Motor: 5W-30 Sintético dexos1 Gen3 (3.8L - 4.2L)',
      'Líquido de Frenos: DOT 4 Sintético',
      'Refrigerante: DEX-COOL 50/50 de larga duración',
    ];
    recommendation = 'Este es un hito de mantenimiento mayor fundamental para la longevidad del motor y la seguridad de frenado.';
  } else if (isIntermediate20k) {
    typeBadge = 'Preventivo Intermedio';
    title = `Mantenimiento Intermedio (${nextMileage.toLocaleString()} km)`;
    items = [
      'Cambio de aceite de motor sintético 5W-30 dexos1 + filtro de aceite',
      'Reemplazo de filtro de aire de motor',
      'Reemplazo de filtro de cabina para aire acondicionado (polen)',
      'Limpieza, calibración y regulación de frenos en las 4 ruedas',
      'Alineación y balanceo computarizado de 4 neumáticos',
      'Revisión de tren delantero, terminales y amortiguadores',
    ];
    fluidSpecs = [
      'Aceite de Motor: 5W-30 dexos1 Gen3',
      'Filtros: Aceite, Aire y Cabina A/C',
    ];
    recommendation = 'Incluye el cambio de filtro de cabina para asegurar aire limpio en el habitáculo y regulación de frenos.';
  }

  return {
    title,
    milestoneKm: nextMileage,
    remainingKm,
    isOverdue,
    typeBadge,
    items,
    fluidSpecs,
    recommendation,
  };
}

export interface UpdateOdometerResult {
  success: boolean;
  error?: string;
  previousMileage?: number;
  newMileage?: number;
}

/**
 * Updates vehicle odometer via secure public RPC with anti-rollback validation.
 */
export async function updatePublicOdometer(
  supabase: SupabaseClient,
  vehicleId: string,
  mileage: number
): Promise<UpdateOdometerResult> {
  if (!vehicleId || mileage <= 0) {
    return { success: false, error: 'Datos de kilometraje o vehículo inválidos' };
  }

  try {
    const { data, error } = await supabase.rpc('update_public_vehicle_odometer', {
      p_vehicle_id: vehicleId,
      p_mileage: mileage,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === 'object') {
      const res = data as Record<string, unknown>;
      return {
        success: Boolean(res.success),
        error: res.error ? String(res.error) : undefined,
        previousMileage: typeof res.previous_mileage === 'number' ? res.previous_mileage : undefined,
        newMileage: typeof res.new_mileage === 'number' ? res.new_mileage : undefined,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al actualizar odómetro';
    return { success: false, error: msg };
  }
}

