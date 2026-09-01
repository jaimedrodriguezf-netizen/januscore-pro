import type { QrParser, QrParseResult } from './parser';

/**
 * R3 — Generic / unsupported-bank fallback parser (lib/qr/generic.ts).
 *
 * The generic parser claims EVERY raw QR string the Pichincha parser does not.
 * It tags `bank: 'unknown'` so the verify pipeline routes the receipt to review
 * as `unsupported` (R3 scenario: QR from a non-Pichincha bank → review, NOT
 * auto-reject, NOT fraud-flagged — only a signature failure is fraud per R4).
 *
 * It performs a best-effort `key:value` / `key=value` line parse (ported from
 * the SPI path of the Laravel reference) so the structured fields are still
 * surfaced as a hint, but no signature slice is produced (generic banks are not
 * signed by a key this tenant is configured to verify).
 */

export const genericParser: QrParser = {
  name: 'generic',
  bank: 'unknown',
  matches(): boolean {
    // Fallback: always claims. Tried LAST by the registry (findQrParser).
    return true;
  },
  parse(raw: string): QrParseResult {
    const fields: Record<string, string | null> = {
      bank: null,
      monto: null,
      fecha: null,
      nro_comprobante: null,
      ordenante: null,
      beneficiario: null,
      banco_origen: null,
      banco_destino: null,
      cuenta_origen: null,
      cuenta_destino: null,
      ruc_ci: null,
      concepto: null,
      moneda: null,
    };
    const lines = (raw ?? '').split(/\r?\n/);
    const keyMap: Record<string, keyof typeof fields> = {
      monto: 'monto', amount: 'monto', importe: 'monto',
      fecha: 'fecha', date: 'fecha',
      nro_comprobante: 'nro_comprobante', comprobante: 'nro_comprobante',
      ordenante: 'ordenante', sender: 'ordenante', de: 'ordenante',
      beneficiario: 'beneficiario', receiver: 'beneficiario', para: 'beneficiario',
      banco_origen: 'banco_origen', banco_destino: 'banco_destino',
      cuenta_origen: 'cuenta_origen', cuenta_destino: 'cuenta_destino',
      cuenta: 'cuenta_destino',
      ruc_ci: 'ruc_ci', ruc: 'ruc_ci', ci: 'ruc_ci', cedula: 'ruc_ci',
      concepto: 'concepto', concept: 'concepto',
      moneda: 'moneda', currency: 'moneda',
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const sep = trimmed.indexOf(':') >= 0 ? ':' : '=';
      const idx = trimmed.indexOf(sep);
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim().toLowerCase();
      const value = trimmed.slice(idx + 1).trim();
      const mapped = keyMap[key];
      if (mapped) fields[mapped] = value;
    }
    // No signature slice: generic banks are unsigned/unconfigured for v1.
    return { fields };
  },
};