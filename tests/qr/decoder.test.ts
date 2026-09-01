import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { JsQrImageDecoder, getDefaultQrDecoder } from '@/lib/qr/decoder';

describe('In-Memory QR Image Decoder (JsQrImageDecoder)', () => {
  const decoder = new JsQrImageDecoder();

  it('decodes a real PNG QR code image accurately', async () => {
    const rawContent = 'ONLINE:BP_TO_DEUNA:Banco Pichincha:JUAN PEREZ:0123456789:100.00:REF12345';
    const filePath = join(tmpdir(), `test-qr-${Date.now()}.png`);

    try {
      await QRCode.toFile(filePath, rawContent, {
        type: 'png',
        width: 300,
      });

      const decoded = await decoder.decode(filePath, 'image/png');
      expect(decoded).toBe(rawContent);
    } finally {
      try {
        unlinkSync(filePath);
      } catch {
        // ignore cleanup error
      }
    }
  });

  it('returns null when an image has no QR code', async () => {
    const filePath = join(tmpdir(), `blank-img-${Date.now()}.png`);
    const png = new PNG({ width: 100, height: 100 });
    // Fill with white pixels
    png.data.fill(255);
    const buffer = PNG.sync.write(png);
    writeFileSync(filePath, buffer);

    try {
      const decoded = await decoder.decode(filePath, 'image/png');
      expect(decoded).toBeNull();
    } finally {
      try {
        unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  });

  it('returns null safely on corrupt or non-image files (never throws)', async () => {
    const filePath = join(tmpdir(), `corrupt-${Date.now()}.png`);
    writeFileSync(filePath, Buffer.from('NOT_AN_IMAGE_DATA_CORRUPT'));

    try {
      const decoded = await decoder.decode(filePath, 'image/png');
      expect(decoded).toBeNull();
    } finally {
      try {
        unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  });

  it('getDefaultQrDecoder returns a functional QrImageDecoder', () => {
    const defaultDecoder = getDefaultQrDecoder();
    expect(defaultDecoder).not.toBeNull();
    expect(typeof defaultDecoder?.decode).toBe('function');
  });
});
