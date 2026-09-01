import { readFileSync } from 'node:fs';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import type { QrImageDecoder } from './pipeline';

/**
 * Pure JavaScript / in-memory QR image decoder.
 * Reads PNG or JPEG buffers and decodes QR codes using jsQR.
 * Total function: catches corrupt images and returns null without throwing.
 */
export class JsQrImageDecoder implements QrImageDecoder {
  async decode(localPath: string, mime: string): Promise<string | null> {
    try {
      const buffer = readFileSync(localPath);
      const cleanMime = (mime || '').toLowerCase();

      let width = 0;
      let height = 0;
      let data: Uint8Array | Uint8ClampedArray | null = null;

      if (cleanMime.includes('png') || localPath.endsWith('.png')) {
        try {
          const png = PNG.sync.read(buffer);
          width = png.width;
          height = png.height;
          data = png.data;
        } catch {
          // PNG parse failed, fallback below
        }
      }

      if (!data && (cleanMime.includes('jpeg') || cleanMime.includes('jpg') || localPath.endsWith('.jpg') || localPath.endsWith('.jpeg'))) {
        try {
          const rawJpeg = jpeg.decode(buffer, { useTArray: true });
          width = rawJpeg.width;
          height = rawJpeg.height;
          data = rawJpeg.data;
        } catch {
          // JPEG parse failed
        }
      }

      // If still not parsed, attempt PNG then JPEG
      if (!data) {
        try {
          const png = PNG.sync.read(buffer);
          width = png.width;
          height = png.height;
          data = png.data;
        } catch {
          try {
            const rawJpeg = jpeg.decode(buffer, { useTArray: true });
            width = rawJpeg.width;
            height = rawJpeg.height;
            data = rawJpeg.data;
          } catch {
            return null;
          }
        }
      }

      if (!data || width === 0 || height === 0) {
        return null;
      }

      const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
      const qrCode = jsQR(clamped, width, height);

      return qrCode?.data ?? null;
    } catch {
      return null;
    }
  }
}

let defaultDecoderInstance: QrImageDecoder | null = null;

export function getDefaultQrDecoder(): QrImageDecoder {
  if (!defaultDecoderInstance) {
    defaultDecoderInstance = new JsQrImageDecoder();
  }
  return defaultDecoderInstance;
}
