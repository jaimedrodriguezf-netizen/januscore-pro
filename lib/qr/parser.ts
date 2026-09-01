/**
 * R3 — QR parser contract (lib/qr/parser.ts).
 *
 * v1 supports Banco Pichincha only (spec R3). The parser is PLUGGABLE through
 * this interface + a registry, so a future bank (SPI, Deuna, …) plugs in by
 * adding a parser to `getQrParsers()` without touching the verify pipeline.
 *
 * The interface matches the design contract exactly: each parser declares a
 * stable `bank` identifier, `matches(raw)` decides whether it claims a raw QR
 * string, and `parse(raw)` returns the structured fields plus the signed-data
 * / signature slices the Ed25519 verifier needs (lib/crypto/ed25519.ts).
 *
 * The raw QR string is the already-decoded QR text (the byte payload of the QR
 * code). PR4 implements parsing + signature verification on that string; the
 * QR *image* decode (pixels → raw string) is a forward link (no decoder lib is
 * approved for v1) and is injected through `QrImageDecoder` in
 * lib/qr/pipeline.ts.
 */

export type QrBank = 'pichincha' | 'generic' | 'unknown';

export interface QrParseResult {
  /** Structured fields parsed from the raw QR string (a hint; never trusted blindly). */
  fields: Record<string, string | null>;
  /** The exact bytes covered by the signature (hex-encoded by the parser). */
  signedData?: string;
  /** Hex-encoded Ed25519 signature, or undefined when the QR is unsigned. */
  signature?: string;
}

export interface QrParser {
  /** Stable parser identity persisted on qr_verifications.parser_name. */
  readonly name: string;
  /** Detected bank identifier persisted on qr_verifications.bank. */
  readonly bank: QrBank;
  /** True iff this parser claims the raw QR string (tried in registry order). */
  matches(raw: string): boolean;
  /** Parse the raw QR string. MUST be total — never throw on malformed input. */
  parse(raw: string): QrParseResult;
}

export const PICHINCHA_BANK = 'Pichincha';

import { pichinchaParser } from './pichincha';
import { genericParser } from './generic';

/**
 * Ordered registry of v1 parsers. Pichincha is tried first; the generic parser
 * is the fallback that claims anything (it tags `bank: 'unknown'` so the verify
 * pipeline routes a non-Pichincha QR to review as `unsupported`, per R3). Add a
 * new bank by inserting its parser BEFORE the generic fallback.
 */
export function getQrParsers(): QrParser[] {
  return [pichinchaParser, genericParser];
}

export interface ResolvedParser {
  parser: QrParser;
  result: QrParseResult;
}

/**
 * Find the first parser whose `matches(raw)` returns true and parse the raw
 * string with it. Returns `null` when NO parser claims the string (impossible
 * by construction — the generic fallback matches everything — but defensive: a
 * future registry edit that drops the fallback still gets a clean `null` rather
 * than an unhandled crash). The caller treats `null` as `unsupported`.
 */
export function findQrParser(raw: string): ResolvedParser | null {
  for (const parser of getQrParsers()) {
    if (parser.matches(raw)) {
      return { parser, result: parser.parse(raw) };
    }
  }
  return null;
}