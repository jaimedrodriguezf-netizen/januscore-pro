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
