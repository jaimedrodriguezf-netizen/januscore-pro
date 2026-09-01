import type { QrParser, QrParseResult, QrBank } from './parser';
import { PICHINCHA_BANK } from './parser';

/**
 * R3 — Banco Pichincha QR parser (lib/qr/pichincha.ts).
 *
 * Ports the colon-delimited Pichincha QR format from the Laravel reference
 * (app/Services/QrService.php::parsePichinchaPayload). The format is a flat
 * `:`-delimited positional payload:
 *
 *   ONLINE:BP_TO_DEUNA:Banco Pichincha:<ordenante>:<cuenta_origen>:<banco_destino>:<beneficiario>:<cuenta_destino>:<monto>:<epoch>:<uuid>:<nro_comprobante>:<signature...>
 *
 * The signed data is the FIRST 12 colon-delimited parts (joined by `:`); the
 * signature is everything from part 12 onward (joined by `:`). This mirrors the
 * Laravel reference exactly so a signature verified there verifies here too.
 *
 * Pichincha is the ONLY required bank in v1 (spec R3). Unsupported banks do NOT
 * match this parser; they fall through to the generic parser which tags them
 * `unknown` → the verify pipeline routes them to review as `unsupported`.
 */

const PICHINCHA_PREFIXES = ['ONLINE:', 'BP_TO_', 'BP_'];

export const pichinchaParser: QrParser = {
  name: 'pichincha',
  bank: 'pichincha' as QrBank,
  matches(raw: string): boolean {
    const trimmed = (raw ?? '').trim();
    return PICHINCHA_PREFIXES.some((p) => trimmed.startsWith(p));
  },
  parse(raw: string): QrParseResult {
    const fields: Record<string, string | null> = {
      bank: PICHINCHA_BANK,
      banco_origen: null,
      ordenante: null,
      cuenta_origen: null,
      banco_destino: null,
      beneficiario: null,
      cuenta_destino: null,
      monto: null,
      fecha: null,
      nro_comprobante: null,
      concepto: null,
      ruc_ci: null,
      moneda: 'USD',
    };
    const parts = (raw ?? '').split(':');

    // Positional mapping (mirrors parsePichinchaPayload in QrService.php).
    if (parts[2] != null) fields.banco_origen = parts[2];
    if (parts[3] != null) fields.ordenante = parts[3];
    if (parts[4] != null) fields.cuenta_origen = parts[4];
    if (parts[5] != null) fields.banco_destino = parts[5];
    if (parts[6] != null) fields.beneficiario = parts[6];
    if (parts[7] != null) fields.cuenta_destino = parts[7];
    if (parts[8] != null) fields.monto = parts[8];
    if (parts[9] != null) {
      const ts = Number(parts[9]);
      // Only convert plausible post-2001 epoch seconds (PHP: ts > 1_000_000_000).
      if (Number.isFinite(ts) && ts > 1_000_000_000) {
        fields.fecha = new Date(ts * 1000).toISOString().slice(0, 10);
      }
    }
    if (parts[11] != null) fields.nro_comprobante = parts[11];

    // Signature: everything from position 12 onward; signed data = parts 0..11.
    if (parts.length > 12) {
      return {
        fields,
        signedData: parts.slice(0, 12).join(':'),
        signature: parts.slice(12).join(':'),
      };
    }
    return { fields };
  },
};