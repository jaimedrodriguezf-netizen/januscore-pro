import { createHash } from 'node:crypto';
import { verify as nobleVerify, hashes } from '@noble/ed25519';

/**
 * R3 — Ed25519 signature verification (lib/crypto/ed25519.ts).
 *
 * Uses `@noble/ed25519` (pure JS, audited, no native deps — works Node+Deno).
 * v3 of the library made the SHA-512 hash pluggable; we wire it to Node's
 * `node:crypto` sha512 once at module load so both sync (`verify`) and async
 * (`verifyAsync`) paths work without an extra `@noble/hashes` dependency.
 *
 * Public keys are stored hex-encoded on `bank_public_keys.public_key`. The QR
 * signature is also hex-encoded (mirrors the Laravel reference's
 * `sodium_hex2bin($signature)`). `signedData` is the UTF-8 bytes of the signed
 * string (mirrors `sodium_crypto_sign_verify_detached(sig, $signedData, pub)`).
 */

let shimmed = false;
export function ensureNobleSha512(): void {
  if (shimmed) return;
  // noble v3 made SHA-512 pluggable. Wire it to Node's `node:crypto` sha512 so
  // both sync (`verify`) and async (`verifyAsync`) paths work without an extra
  // `@noble/hashes` dependency. `Uint8Array.from` copies into a fresh
  // ArrayBuffer-backed Uint8Array (noble v3 demands `Uint8Array<ArrayBuffer>`,
  // not a Buffer or a SharedArrayBuffer-backed view).
  const sha512 = (msg: Uint8Array): Uint8Array =>
    Uint8Array.from(createHash('sha512').update(msg).digest());
  hashes.sha512 = sha512 as typeof hashes.sha512;
  hashes.sha512Async = (async (msg: Uint8Array) => sha512(msg)) as typeof hashes.sha512Async;
  shimmed = true;
}

export interface VerifyEd25519Args {
  /** Hex-encoded 32-byte Ed25519 public key (bank_public_keys.public_key). */
  publicKeyHex: string;
  /** Hex-encoded 64-byte Ed25519 signature. */
  signatureHex: string;
  /** The signed payload (signed_data) — verified as UTF-8 bytes. */
  signedData: string;
}

export interface VerifyEd25519Result {
  ok: boolean;
  /** False only for a well-formed but non-matching signature. True = invalid encoding / internal error. */
  malformed: boolean;
}

/**
 * Verify an Ed25519 signature. NEVER throws: a malformed key, malformed
 * signature, or internal error returns `{ ok: false, malformed: true }` so the
 * caller (verify pipeline) can persist a `failed` qr_verification and route the
 * receipt to review with a fraud flag (R4 — a signature failure is NEVER an
 * auto-reject and NEVER a swallowed exception that leaves the receipt pending).
 */
export async function verifyEd25519(args: VerifyEd25519Args): Promise<VerifyEd25519Result> {
  try {
    ensureNobleSha512();
    const publicKey = hexToBytes(args.publicKeyHex);
    const signature = hexToBytes(args.signatureHex);
    if (publicKey.length !== 32 || signature.length !== 64) {
      return { ok: false, malformed: true };
    }
    const message = new TextEncoder().encode(args.signedData);
    const ok = nobleVerify(signature, message, publicKey);
    return { ok, malformed: false };
  } catch {
    return { ok: false, malformed: true };
  }
}

/** Strict hex decoder — only [0-9a-fA-F], even length; otherwise throws. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error(`invalid hex (len=${clean.length})`);
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0, j = 0; i < clean.length; i += 2, j += 1) {
    out[j] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}