import { describe, expect, it, beforeAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import { sign, getPublicKey } from '@noble/ed25519';
import { pichinchaParser } from '@/lib/qr/pichincha';
import { genericParser } from '@/lib/qr/generic';
import { findQrParser, getQrParsers } from '@/lib/qr/parser';
import { verifyEd25519, hexToBytes, ensureNobleSha512 } from '@/lib/crypto/ed25519';

/**
 * Phase 4 / 4.2–4.5, 4.7(crypto), 4.9 — QR parser + Ed25519 crypto unit tests.
 *
 * Pure unit: no DB / Supabase / Storage. The Ed25519 verify path runs FOR REAL
 * against a fresh key pair (the @noble/ed25519 v3 sha512 shim is wired to
 * node:crypto), so the valid-signature and tampered-signature branches are
 * genuine, not stubbed.
 */

// Build a real signed Pichincha QR payload for the verified/tampered tests.
function buildSignedPichinchaQr(priv: Uint8Array): string {
  const parts = [
    'ONLINE', 'BP_TO_DEUNA', 'Banco Pichincha', 'JUAN PEREZ', '0123456789',
    'Banco Pichincha', 'MARIA LOPEZ', '9876543210', '1.234,56', '1710400000',
    'uuid-1234', '8723498273',
  ];
  const signedData = parts.join(':');
  const sig = sign(new TextEncoder().encode(signedData), priv);
  return parts.join(':') + ':' + Buffer.from(sig).toString('hex');
}

describe('4.2 / 4.3 — Pichincha parser', () => {
  it('matches the ONLINE:/BP_ prefix and reports bank=pichincha', () => {
    expect(pichinchaParser.matches('ONLINE:BP_TO_DEUNA:Banco Pichincha:rest')).toBe(true);
    expect(pichinchaParser.matches('BP_TO_DEUNA:foo')).toBe(true);
    expect(pichinchaParser.matches('https://otherbank.com')).toBe(false);
    expect(pichinchaParser.matches('')).toBe(false);
  });

  it('parses positional fields and splits signed_data / signature at part 12', () => {
    const raw =
      'ONLINE:BP_TO_DEUNA:Banco Pichincha:JUAN PEREZ:0123456789:Banco Pichincha:MARIA LOPEZ:9876543210:1.234,56:1710400000:uuid-1234:8723498273:DEADBEEF';
    const r = pichinchaParser.parse(raw);
    expect(r.fields.bank).toBe('Pichincha');
    expect(r.fields.banco_origen).toBe('Banco Pichincha');
    expect(r.fields.ordenante).toBe('JUAN PEREZ');
    expect(r.fields.cuenta_origen).toBe('0123456789');
    expect(r.fields.beneficiario).toBe('MARIA LOPEZ');
    expect(r.fields.cuenta_destino).toBe('9876543210');
    expect(r.fields.monto).toBe('1.234,56');
    expect(r.fields.fecha).toBe('2024-03-14'); // 1710400000s → 2024-03-14 UTC
    expect(r.fields.nro_comprobante).toBe('8723498273');
    expect(r.signedData).toBe(
      'ONLINE:BP_TO_DEUNA:Banco Pichincha:JUAN PEREZ:0123456789:Banco Pichincha:MARIA LOPEZ:9876543210:1.234,56:1710400000:uuid-1234:8723498273',
    );
    expect(r.signature).toBe('DEADBEEF');
  });

  it('omits signedData/signature when the payload has no signature part (<13 parts)', () => {
    const raw = 'BP_TO_DEUNA:Banco Pichincha:a:b:c:d:e:f:g:h:i:j';
    const r = pichinchaParser.parse(raw);
    expect(r.signedData).toBeUndefined();
    expect(r.signature).toBeUndefined();
  });

  it('parse is total on malformed input (never throws)', () => {
    expect(() => pichinchaParser.parse('garbage')).not.toThrow();
    // parts[2] is banco_origen; 'ONLINE:prefix:x' → banco_origen = 'x'.
    expect(pichinchaParser.parse('ONLINE:prefix:x').fields.banco_origen).toBe('x');
  });
});

describe('4.4 — generic / unsupported-bank fallback parser', () => {
  it('claims every raw string (tried last by the registry)', () => {
    expect(genericParser.matches('anything')).toBe(true);
    expect(genericParser.matches('')).toBe(true);
  });

  it('tags bank=unknown and parses key:value / key=value lines with no signature', () => {
    const r = genericParser.parse('monto: 5,00\nbanco_origen: SomeBank');
    expect(genericParser.bank).toBe('unknown');
    expect(r.fields.monto).toBe('5,00');
    expect(r.fields.banco_origen).toBe('SomeBank');
    expect(r.signedData).toBeUndefined();
    expect(r.signature).toBeUndefined();
  });
});

describe('4.2 — registry resolves Pichincha first, generic as fallback', () => {
  it('getQrParsers lists pichincha before generic', () => {
    const names = getQrParsers().map((p) => p.name);
    expect(names).toEqual(['pichincha', 'generic']);
  });

  it('findQrParser resolves a Pichincha QR to the Pichincha parser', () => {
    const r = findQrParser('ONLINE:BP_TO_DEUNA:Banco Pichincha:x');
    expect(r?.parser.name).toBe('pichincha');
  });

  it('findQrParser resolves a non-Pichincha QR to the generic fallback', () => {
    const r = findQrParser('https://produbanco.com/pay?monto=10');
    expect(r?.parser.name).toBe('generic');
    expect(r?.parser.bank).toBe('unknown');
  });
});

describe('4.5 / 4.7(crypto) — Ed25519 verify valid vs tampered signature', () => {
  let priv: Uint8Array;
  let pub: Uint8Array;

  beforeAll(() => {
    ensureNobleSha512();
    priv = randomBytes(32);
    pub = getPublicKey(priv);
  });

  it('hexToBytes round-trips a 32-byte public key and rejects bad hex', () => {
    const hex = Buffer.from(pub).toString('hex');
    expect(hexToBytes(hex)).toEqual(pub);
    expect(() => hexToBytes('xyz')).toThrow();
    expect(() => hexToBytes('abc')).toThrow(); // odd length
  });

  it('a real Pichincha signature over the signed_data verifies (4.7 crypto)', async () => {
    const raw = buildSignedPichinchaQr(priv);
    const parsed = pichinchaParser.parse(raw);
    const res = await verifyEd25519({
      publicKeyHex: Buffer.from(pub).toString('hex'),
      signatureHex: parsed.signature!,
      signedData: parsed.signedData!,
    });
    expect(res.ok).toBe(true);
    expect(res.malformed).toBe(false);
  });

  it('a TAMPERED signature does NOT verify (4.8 crypto): ok=false, fraud route', async () => {
    const raw = buildSignedPichinchaQr(priv);
    const parsed = pichinchaParser.parse(raw);
    const sigBytes = hexToBytes(parsed.signature!);
    sigBytes[0] ^= 0xff;
    const tamperedHex = Buffer.from(sigBytes).toString('hex');
    const res = await verifyEd25519({
      publicKeyHex: Buffer.from(pub).toString('hex'),
      signatureHex: tamperedHex,
      signedData: parsed.signedData!,
    });
    expect(res.ok).toBe(false);
    expect(res.malformed).toBe(false);
  });

  it('a tampered message (different signed_data) does NOT verify', async () => {
    const raw = buildSignedPichinchaQr(priv);
    const parsed = pichinchaParser.parse(raw);
    const res = await verifyEd25519({
      publicKeyHex: Buffer.from(pub).toString('hex'),
      signatureHex: parsed.signature!,
      signedData: parsed.signedData!.replace('JUAN PEREZ', 'ATTACKER'),
    });
    expect(res.ok).toBe(false);
  });

  it('malformed key/signature returns ok=false + malformed=true (never throws)', async () => {
    const raw = buildSignedPichinchaQr(priv);
    const parsed = pichinchaParser.parse(raw);
    const res = await verifyEd25519({
      publicKeyHex: 'not-hex',
      signatureHex: parsed.signature!,
      signedData: parsed.signedData!,
    });
    expect(res.ok).toBe(false);
    expect(res.malformed).toBe(true);
  });
});