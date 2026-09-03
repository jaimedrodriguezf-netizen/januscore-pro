import QRCode from 'qrcode';

export interface A4SheetLayout {
  totalStickers: number;
  columns: number;
  rows: number;
  stickers: number[];
}

export interface PrintableStickerData {
  tenantName: string;
  website: string;
  targetUrl: string;
  qrDataUrl: string;
  plate?: string;
  instruction: string;
  workshopPhone?: string;
  logoUrl?: string;
}

/**
 * Calculate standard A4 sticker grid layout (e.g. 15 stickers: 3 columns x 5 rows).
 */
export function calculateA4SheetLayout(params: {
  totalStickers?: number;
  columns?: number;
}): A4SheetLayout {
  const totalStickers = params.totalStickers ?? 15;
  const columns = params.columns ?? 3;
  const rows = Math.ceil(totalStickers / columns);

  const stickers = Array.from({ length: totalStickers }, (_, i) => i + 1);

  return {
    totalStickers,
    columns,
    rows,
    stickers,
  };
}

/**
 * Generate sticker content with QR, brand logo name, website januscore.pro, and instructions.
 */
export async function generatePrintableStickerData(params: {
  tenantName?: string;
  targetUrl?: string;
  plate?: string;
  workshopPhone?: string;
  logoUrl?: string;
}): Promise<PrintableStickerData> {
  const tenantName = params.tenantName || 'JanusCore Auto Service';
  const website = 'januscore.pro';
  const targetUrl = params.targetUrl || (params.plate ? `https://januscore.pro/auto/${params.plate}` : 'https://januscore.pro/auto');

  // Generate crisp, high-resolution QR with tight margins for printing
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const instruction = params.plate
    ? 'Escanea para consultar tu próximo mantenimiento y registrar tu kilometraje'
    : 'Escanea o ingresa tu placa para ver tu próximo mantenimiento';

  return {
    tenantName,
    website,
    targetUrl,
    qrDataUrl,
    plate: params.plate,
    instruction,
    workshopPhone: params.workshopPhone,
    logoUrl: params.logoUrl,
  };
}
