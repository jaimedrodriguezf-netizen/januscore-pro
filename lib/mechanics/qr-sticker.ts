import QRCode from 'qrcode';

export interface StickerData {
  plate: string;
  brand: string;
  model: string;
  nextMileage?: number;
  nextDate?: string;
  workshopName?: string;
  baseUrl: string;
}

/**
 * Generate QR Code data URL for public vehicle page.
 */
export async function generateVehicleQrDataUrl(baseUrl: string, plate: string): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/auto/${encodeURIComponent(plate.toUpperCase())}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 250,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
