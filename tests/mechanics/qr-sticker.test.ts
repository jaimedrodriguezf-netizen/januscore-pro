import { describe, expect, it } from 'vitest';
import { generateVehicleQrDataUrl } from '@/lib/mechanics/qr-sticker';

describe('Vehicle QR Sticker Generator', () => {
  it('generates a valid data URL containing a QR code', async () => {
    const dataUrl = await generateVehicleQrDataUrl('https://januscore.pro', 'PBX-1234');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});
