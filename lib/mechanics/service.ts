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

  let title = `Mantenimiento Preventivo (${nextMileage.toLocaleString()} km)`;
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
