import { describe, it, expect } from 'vitest';
import {
  formatWhatsAppUrl,
  formatGoogleMapsUrl,
  sanitizeSlug,
  isValidSlug,
  type WorkshopProfile,
} from '@/lib/mechanics/workshop-profile';

describe('Workshop Profile & Branded Public Routing (SDD/TDD)', () => {
  it('formats WhatsApp URL with clean country code and pre-filled service message', () => {
    const url = formatWhatsAppUrl({
      phone: '099 123 4567',
      plate: 'PBX-1234',
      vehicleModel: 'Toyota Hilux 2.8',
      currentKm: 45000,
      serviceTitle: 'ABC de Motor 50.000 km',
    });

    expect(url).toContain('api.whatsapp.com/send?phone=593991234567');
    expect(url).toContain('PBX-1234');
    expect(url).toContain('Toyota%20Hilux%202.8');
    expect(url).toContain('45.000%20km');
    expect(url).toContain('ABC%20de%20Motor%2050.000%20km');
  });

  it('formats Google Maps URL from custom URL or structured address', () => {
    const directUrl = formatGoogleMapsUrl({
      googleMapsUrl: 'https://maps.app.goo.gl/xyz123',
      address: 'Av. 10 de Agosto y Colón',
      city: 'Quito',
    });
    expect(directUrl).toBe('https://maps.app.goo.gl/xyz123');

    const searchUrl = formatGoogleMapsUrl({
      address: 'Av. Juan Tanca Marengo Km 4.5',
      city: 'Guayaquil',
    });
    expect(searchUrl).toContain('https://www.google.com/maps/search/?api=1');
    expect(searchUrl).toContain('Av.%20Juan%20Tanca%20Marengo');
    expect(searchUrl).toContain('Guayaquil');
  });

  it('validates and sanitizes workshop slugs for custom brand URLs', () => {
    expect(sanitizeSlug('Mecánica & Taller Pílozo S.A.')).toBe('mecanica-taller-pilozo-sa');
    expect(isValidSlug('taller-pilozo')).toBe(true);
    expect(isValidSlug('Taller Pilozo')).toBe(false);
    expect(isValidSlug('ab')).toBe(false); // min 3 chars
  });
});
