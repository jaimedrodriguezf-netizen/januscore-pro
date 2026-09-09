export type BusinessType = 'all' | 'mechanics' | 'financial_receipts';
export type BusinessModule = 'workshop' | 'financial_receipts' | 'admin';

/**
 * Checks if a target business module is allowed for a given tenant's business type.
 * - 'all': Has access to all modules.
 * - 'mechanics': Has access to workshop and general admin, but not financial receipts.
 * - 'financial_receipts': Has access to financial receipts and general admin, but not workshop.
 */
export function isModuleAllowedForBusinessType(
  businessType: BusinessType,
  module: BusinessModule
): boolean {
  if (businessType === 'all') return true;
  if (module === 'admin') return true;
  if (businessType === 'mechanics') return module === 'workshop';
  if (businessType === 'financial_receipts') return module === 'financial_receipts';
  return false;
}
