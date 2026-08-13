/**
 * R2 — Server-side OCR contract (lib/ocr/engine.ts).
 *
 * Extraction is a HINT, never trusted blindly (R2). The engine is swappable via
 * this abstract interface: the route / pipeline talk to `OcrEngine`, never to a
 * concrete implementation, so an admin can swap Tesseract for Textract/DocAI or
 * a mock in tests without changing call sites (R2 RED: engine swap preserves the
 * extraction contract — see tests/ocr/tesseract.test.ts).
 *
 * Error model: engines throw typed `OcrExtractionError` subclasses so the
 * pipeline can persist a `failed` extraction_result and leave the receipt
 * `pending` (threat matrix: subprocess returns a structured error, the receipt
 * is never auto-rejected, never auto-approved).
 */

export interface OcrExtractionInput {
  /** Local filesystem path to the file to OCR (route handler downloads the
   * immutable Storage object to a temp file before calling the engine). */
  path: string;
  /** MIME type of the source file (engine may route TIFF vs PDF differently). */
  mime: string;
}

export interface OcrExtractionOutput {
  /** Structured fields — a HINT. Unmatched fields are `null`, never invented. */
  fields: Record<string, string | null>;
  /** Per-field heuristic confidence in [0,1]. Only matched fields appear here. */
  confidence: Record<string, number>;
  /** Full raw OCR text output; retained so a swap can re-parse without re-OCR. */
  rawText: string;
}

/** A pluggable OCR backend. Concrete impl: lib/ocr/tesseract.ts. */
export interface OcrEngine {
  /** Stable engine identifier persisted on extraction_results.engine_name. */
  readonly name: string;
  extract(input: OcrExtractionInput): Promise<OcrExtractionOutput>;
}

/** Base class for every OCR failure surfaced by an engine. */
export abstract class OcrExtractionError extends Error {
  constructor(
    message: string,
    /** Stable machine code persisted alongside a `failed` extraction_result. */
    public readonly code: OcrErrorCode,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export type OcrErrorCode =
  | 'ocr_timeout'
  | 'ocr_binary_missing'
  | 'ocr_output_too_large'
  | 'ocr_failed';

/** Subprocess exceeded its timeout — the receipt MUST stay pending. */
export class OcrTimeoutError extends OcrExtractionError {
  constructor(message: string) {
    super(message, 'ocr_timeout');
  }
}

/** The configured OCR binary could not be found — degrade gracefully (R2). */
export class OcrBinaryMissingError extends OcrExtractionError {
  constructor(message: string) {
    super(message, 'ocr_binary_missing');
  }
}

/** The OCR subprocess produced more bytes than the configured output cap. */
export class OcrOutputTooLargeError extends OcrExtractionError {
  constructor(message: string) {
    super(message, 'ocr_output_too_large');
  }
}

/** Any non-timeout, non-binary OCR failure (non-zero exit, parse failure, …). */
export class OcrExtractionFailedError extends OcrExtractionError {
  constructor(message: string) {
    super(message, 'ocr_failed');
  }
}

/** True for any OcrExtractionError subclass instance. */
export function isOcrExtractionError(value: unknown): value is OcrExtractionError {
  return value instanceof OcrExtractionError;
}