import { formatPlate } from './service';
import { lookupTaxId as defaultLookupTaxId } from '@/lib/billing/cipherbyte';
import type { Vehicle } from './types';

export interface VehicleLookupResult {
  found: boolean;
  vehicle: Vehicle | null;
}

export interface ClientProfile {
  identification: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface ClientLookupResult {
  found: boolean;
  source?: 'local' | 'sri';
  client: ClientProfile | null;
  vehicles?: Vehicle[];
}

export interface ClientLookupOptions {
  lookupSri?: boolean;
  cipherbyteApiKey?: string;
  sriLookupFn?: (taxId: string, apiKey?: string) => Promise<{ name: string; tax_id: string } | null>;
}

/**
 * Check if a vehicle plate is already registered within a given workshop/tenant.
 */
export async function lookupVehicleByPlate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  rawPlate: string
): Promise<VehicleLookupResult> {
  const trimmed = (rawPlate || '').trim();
  if (!trimmed) {
    return { found: false, vehicle: null };
  }

  const plate = formatPlate(trimmed);
  if (!plate) {
    return { found: false, vehicle: null };
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('plate', plate)
    .maybeSingle();

  if (error || !data) {
    return { found: false, vehicle: null };
  }

  return { found: true, vehicle: data as Vehicle };
}

/**
 * Look up a client by Ecuadorian Cédula (10 digits) or RUC (13 digits).
 * First searches local workshop vehicles, then optionally falls back to SRI via CipherByte.
 */
export async function lookupClientByIdentification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  rawIdentification: string,
  options?: ClientLookupOptions
): Promise<ClientLookupResult> {
  const cleaned = (rawIdentification || '').trim().replace(/\D/g, '');
  if (cleaned.length !== 10 && cleaned.length !== 13) {
    return { found: false, client: null };
  }

  // 1. Search in existing vehicles registered in this workshop
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('owner_identification', cleaned)
    .order('updated_at', { ascending: false });

  if (vehicles && vehicles.length > 0) {
    const latest = vehicles[0];
    return {
      found: true,
      source: 'local',
      client: {
        identification: cleaned,
        name: latest.owner_name || '',
        phone: latest.owner_phone || '',
        email: latest.owner_email || '',
      },
      vehicles: vehicles as Vehicle[],
    };
  }

  // 2. Fallback to SRI via CipherByte if requested
  if (options?.lookupSri) {
    const sriFn = options.sriLookupFn || defaultLookupTaxId;
    try {
      const sriResult = await sriFn(cleaned, options.cipherbyteApiKey);
      if (sriResult && sriResult.name) {
        return {
          found: true,
          source: 'sri',
          client: {
            identification: cleaned,
            name: sriResult.name,
          },
        };
      }
    } catch {
      // SRI query failure should not break the workflow
    }
  }

  return { found: false, client: null };
}
