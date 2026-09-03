export interface WorkshopProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  whatsappPhone?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  googleMapsUrl?: string | null;
  operatingHours?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Clean and format a phone number to standard international WhatsApp format.
 * Defaults Ecuador code (593) when a local 9-10 digit number is given (e.g. 0991234567 -> 593991234567).
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If local Ecuador mobile e.g. 0991234567 (10 digits starting with 09)
  if (digits.startsWith('09') && digits.length === 10) {
    return `593${digits.slice(1)}`;
  }

  // If already starting with 5939 and 12 digits
  if (digits.startsWith('593') && digits.length === 12) {
    return digits;
  }

  // If 9 digits starting with 9
  if (digits.startsWith('9') && digits.length === 9) {
    return `593${digits}`;
  }

  return digits;
}

/**
 * Generate a direct WhatsApp link with pre-filled maintenance request message.
 */
export function formatWhatsAppUrl(params: {
  phone?: string | null;
  plate: string;
  vehicleModel?: string;
  currentKm?: number;
  serviceTitle?: string;
}): string {
  const normalizedPhone = params.phone ? normalizeWhatsAppNumber(params.phone) : '';
  
  let msg = `Hola, deseo agendar una cita para mi vehículo (Placa: ${params.plate}`;
  if (params.vehicleModel) {
    msg += ` - ${params.vehicleModel}`;
  }
  msg += `).`;

  if (params.currentKm) {
    const formattedKm = Number(params.currentKm).toLocaleString('es-EC');
    msg += `\nKilometraje actual: ${formattedKm} km.`;
  }

  if (params.serviceTitle) {
    msg += `\nServicio requerido: "${params.serviceTitle}".`;
  }

  const encodedMsg = encodeURIComponent(msg);

  if (normalizedPhone) {
    return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedMsg}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}

/**
 * Generate a Google Maps link from explicit URL or structured address and city.
 */
export function formatGoogleMapsUrl(params: {
  googleMapsUrl?: string | null;
  address?: string | null;
  city?: string | null;
}): string | null {
  if (params.googleMapsUrl?.trim()) {
    return params.googleMapsUrl.trim();
  }

  const queryParts = [params.address?.trim(), params.city?.trim(), 'Ecuador'].filter(Boolean);
  if (queryParts.length <= 1 && !params.address) {
    return null;
  }

  const query = encodeURIComponent(queryParts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Sanitize a raw string into a clean URL slug (e.g. "Mecánica & Taller Pílozo S.A." -> "mecanica-taller-pilozo-sa").
 */
export function sanitizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\./g, '') // remove dots (e.g. S.A. -> SA)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, 50); // limit length
}

/**
 * Validate whether a string is a valid tenant slug (lowercase letters, numbers, hyphens, min 3 chars).
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}
