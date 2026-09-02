import { describe, it, expect } from 'vitest';
import { calculateA4SheetLayout, generatePrintableStickerData } from '@/lib/mechanics/printable-sheet';

describe('A4 Printable Sticker Sheet Layout (SDD/TDD)', () => {
  it('calculates 3x5 grid layout for 15 stickers on standard A4 page', () => {
    const layout = calculateA4SheetLayout({ totalStickers: 15, columns: 3 });

    expect(layout.totalStickers).toBe(15);
    expect(layout.columns).toBe(3);
    expect(layout.rows).toBe(5);
    expect(layout.stickers.length).toBe(15);
  });

  it('generates sticker data with logo, website januscore.pro, and public qr link', async () => {
    const stickerData = await generatePrintableStickerData({
      tenantName: 'JanusCore Auto Service',
      targetUrl: 'https://januscore.pro/auto',
      plate: 'PBX-1234',
    });

    expect(stickerData.website).toBe('januscore.pro');
    expect(stickerData.tenantName).toBe('JanusCore Auto Service');
    expect(stickerData.qrDataUrl).toContain('data:image/png;base64');
    expect(stickerData.instruction).toContain('mantenimiento');
  });

  it('generates generic public sticker data when no plate is provided', async () => {
    const stickerData = await generatePrintableStickerData({
      tenantName: 'Taller Mecánico Especializado',
      targetUrl: 'https://januscore.pro/auto',
    });

    expect(stickerData.website).toBe('januscore.pro');
    expect(stickerData.plate).toBeUndefined();
    expect(stickerData.qrDataUrl).toContain('data:image/png;base64');
  });
});
