import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import {
  type OcrEngine,
  type OcrExtractionInput,
  type OcrExtractionOutput,
  OcrExtractionFailedError,
  OcrTimeoutError,
  OcrBinaryMissingError,
  OcrOutputTooLargeError,
} from './engine';

/**
 * R2 — Tesseract OCR engine (lib/ocr/tesseract.ts).
 *
 * Implemented via `node:child_process` with a hard subprocess safety envelope
 * per the threat matrix:
 *   - **Allowlist binary path**: only the configured binary runs. The path comes
 *     from the trusted constructor (tests) or `TESSERACT_PATH` env / default
 *     `tesseract` on PATH — never from user upload input.
 *   - **25s timeout** (default): the subprocess is SIGKILLed on timeout and the
 *     call rejects with `OcrTimeoutError`; the receipt stays `pending`.
 *   - **Output size cap** (default 10 MiB): stdout larger than the cap is
 *     truncated, the child is killed, and the call rejects with
 *     `OcrOutputTooLargeError`.
 *   - **NO shell**: `spawn(binaryPath, args, { shell: false })`. Arguments are an
 *     allowlisted tesseract argv; the only untrusted value is the local temp
 *     file path the route handler itself just created.
 *
 * Extraction is a HINT (R2): `parseReceiptFields` populates `fields` heuristically
 * from the raw tesseract text and leaves unmatched fields `null` (poor-quality
 * image → partial/empty fields → route flags `needs_review`).
 */

export interface TesseractEngineOptions {
  /** Allowlisted tesseract binary path. Default `process.env.TESSERACT_PATH ?? 'tesseract'`. */
  binaryPath?: string;
  /** Tesseract language(s). Default `process.env.TESSERACT_LANG ?? 'eng'`. */
  lang?: string;
  /** Subprocess timeout. Default 25_000ms (R2 threat matrix). */
  timeoutMs?: number;
  /** Max stdout bytes before the call rejects. Default 10 MiB. */
  maxOutputBytes?: number;
  /** Extra tesseract args appended after the standard argv. */
  extraArgs?: string[];
  /** PSM mode (page segmentation). Default 6 (single uniform block of text). */
  psm?: number;
}

const DEFAULT_BINARY = process.env.TESSERACT_PATH ?? 'tesseract';
const DEFAULT_LANG = process.env.TESSERACT_LANG ?? 'eng';
/** Production subprocess timeout (threat matrix: 25s). Exported for tests. */
export const DEFAULT_TIMEOUT_MS = 25_000;
/** Production stdout cap (threat matrix: 10 MiB). Exported for tests. */
export const DEFAULT_MAX_OUTPUT_BYTES = 10 * 1024 * 1024;
/** Production page-segmentation mode. Exported for tests. */
export const DEFAULT_PSM = 6;

export class TesseractEngine implements OcrEngine {
  readonly name = 'tesseract';
  private readonly binaryPath: string;
  private readonly lang: string;
  private readonly timeoutMs: number;
  private readonly maxOutputBytes: number;
  private readonly extraArgs: string[];

  constructor(opts: TesseractEngineOptions = {}) {
    this.binaryPath = opts.binaryPath ?? DEFAULT_BINARY;
    this.lang = opts.lang ?? DEFAULT_LANG;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputBytes = opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    const psm = opts.psm ?? DEFAULT_PSM;
    this.extraArgs = [...(opts.extraArgs ?? []), '--psm', String(psm)];
  }

  async extract(input: OcrExtractionInput): Promise<OcrExtractionOutput> {
    // Fail fast with a structured error if the input file is missing — keeps the
    // timeout / missing-binary RED tests honest (they reach the spawn layer).
    try {
      await access(input.path);
    } catch {
      throw new OcrExtractionFailedError(`ocr input file not found: ${input.path}`);
    }

    // tesseract <inputfile> stdout -l <lang> --psm <n> [extra...]
    const args = [input.path, 'stdout', '-l', this.lang, ...this.extraArgs];
    const rawText = await this.runSubprocess(args);
    const { fields, confidence } = parseReceiptFields(rawText);
    return { fields, confidence, rawText };
  }

  private runSubprocess(args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const child = spawn(this.binaryPath, args, { shell: false });

      const chunks: Buffer[] = [];
      let totalBytes = 0;
      let stderr = '';
      let settled = false;
      let timedOut = false;
      let tooLarge = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };
      const timer = setTimeout(() => {
        timedOut = true;
        killChild(child);
      }, this.timeoutMs);

      // `error` fires before `close` for spawn failures (e.g. ENOENT).
      child.on('error', (err) => {
        settle(() => {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(new OcrBinaryMissingError(`tesseract binary not found at ${this.binaryPath}`));
          } else {
            reject(new OcrExtractionFailedError(`failed to spawn tesseract: ${err.message}`));
          }
        });
      });

      child.stdout.on('data', (chunk: Buffer) => {
        if (tooLarge || timedOut) return;
        totalBytes += chunk.byteLength;
        if (totalBytes > this.maxOutputBytes) {
          tooLarge = true;
          killChild(child);
          return;
        }
        chunks.push(chunk);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        // Bound stderr too — a runaway stderr log could otherwise exhaust memory.
        if (stderr.length < 64 * 1024) stderr += chunk.toString('utf8');
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        settle(() => {
          if (timedOut) {
            reject(new OcrTimeoutError(`tesseract timed out after ${this.timeoutMs}ms`));
          } else if (tooLarge) {
            reject(new OcrOutputTooLargeError(`tesseract output exceeded ${this.maxOutputBytes} bytes`));
          } else if (code !== 0) {
            reject(new OcrExtractionFailedError(`tesseract exited with code ${code}: ${stderr.trim()}`));
          } else {
            resolve(Buffer.concat(chunks).toString('utf8'));
          }
        });
      });
    });
  }
}

function killChild(child: ReturnType<typeof spawn>) {
  try {
    child.kill('SIGKILL');
  } catch {
    // Already dead — ignore.
  }
}

/**
 * Heuristic field extractor for Ecuadorian bank receipts (R2 hint). Tesseract
 * `stdout` returns plain text; we recognize the fields named in R2 (bank,
 * amount, date, payer, reference, destination account) via permissive regexes
 * and leave anything unmatched as `null` so the route can flag `needs_review`.
 *
 * Confidence is a flat heuristic: 0.7 when a field regex matches (we trust the
 * match enough to store it, not enough to act on it), 0.0 reserved for clarity.
 * This is deliberately crude — the point of R2 is that extraction is a HINT and
 * the engine is SWAPPABLE; better parsers plug in behind `OcrEngine` later.
 */
export const OCR_FIELD_KEYS = [
  'bank',
  'amount',
  'date',
  'payer',
  'reference',
  'destination_account',
] as const;
export type OcrFieldKey = (typeof OCR_FIELD_KEYS)[number];

const KNOWN_BANKS = [
  'Pichincha',
  'Guayaquil',
  'Produbanco',
  'Pacifico',
  'Pacífico',
  'Bolivariano',
  'Internacional',
];

const AMOUNT_RE = /(?:valor|total|monto)\s*[:=]?\s*\$?\s*(\d[\d.,]{1,20})/i;
const DATE_RE = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/;
const REFERENCE_RE = /(?:referencia|ref\.?)\s*[:=]?\s*([A-Z0-9]{4,30})/i;
const DESTINATION_RE = /cuenta\s+destino\s*[:=]?\s*(\d[\d-]{3,30})/i;
const PAYER_RE = /(?:pagador|de\s*:\s*|cliente)\s*[:=]?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ .]{2,60})/i;

export function parseReceiptFields(
  rawText: string,
): { fields: Record<string, string | null>; confidence: Record<string, number> } {
  const fields: Record<string, string | null> = {
    bank: null,
    amount: null,
    date: null,
    payer: null,
    reference: null,
    destination_account: null,
  };
  const confidence: Record<string, number> = {};
  const text = rawText ?? '';

  const bankHit = KNOWN_BANKS.find((b) =>
    new RegExp(`\\b${b}\\b`, 'i').test(text),
  );
  if (bankHit) {
    fields.bank = canonicalBank(bankHit);
    confidence.bank = 0.7;
  }

  const match = (re: RegExp) => {
    const m = text.match(re);
    if (!m || m[1] == null) return null;
    return clean(m[1]);
  };

  const amount = match(AMOUNT_RE);
  if (amount) {
    fields.amount = amount;
    confidence.amount = 0.7;
  }
  const date = match(DATE_RE);
  if (date) {
    fields.date = date;
    confidence.date = 0.7;
  }
  const reference = match(REFERENCE_RE);
  if (reference) {
    fields.reference = reference;
    confidence.reference = 0.7;
  }
  const destination = match(DESTINATION_RE);
  if (destination) {
    fields.destination_account = destination;
    confidence.destination_account = 0.7;
  }
  const payer = match(PAYER_RE);
  if (payer) {
    fields.payer = payer;
    confidence.payer = 0.7;
  }

  return { fields, confidence };
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function canonicalBank(b: string): string {
  if (/pichincha/i.test(b)) return 'Pichincha';
  if (/guayaquil/i.test(b)) return 'Guayaquil';
  if (/produbanco/i.test(b)) return 'Produbanco';
  if (/pac[íi]fico/i.test(b)) return 'Pacifico';
  if (/bolivariano/i.test(b)) return 'Bolivariano';
  if (/internacional/i.test(b)) return 'Internacional';
  return b;
}

/**
 * Resolve the process-wide default OCR engine (R2 swappable). Returns a
 * `TesseractEngine` by default; returns `null` only when explicitly disabled
 * via `OCR_ENGINE=none` (used by tests / config gating). A *missing* tesseract
 * binary is NOT a config error — the engine still constructs; the failure is
 * surfaced as `OcrBinaryMissingError` at extract time so the threat-matrix
 * graceful-error path genuinely runs (tests/ocr/tesseract.test.ts).
 */
export function getDefaultOcrEngine(): OcrEngine | null {
  if (process.env.OCR_ENGINE === 'none') return null;
  return new TesseractEngine();
}