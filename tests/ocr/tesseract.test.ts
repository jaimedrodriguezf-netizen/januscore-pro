import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {
  TesseractEngine,
  parseReceiptFields,
  getDefaultOcrEngine,
  OCR_FIELD_KEYS,
  DEFAULT_TIMEOUT_MS,
} from '@/lib/ocr/tesseract';
import {
  type OcrEngine,
  type OcrExtractionOutput,
  OcrTimeoutError,
  OcrBinaryMissingError,
  isOcrExtractionError,
} from '@/lib/ocr/engine';
import {
  buildExtractionRow,
  classifyExtraction,
} from '@/lib/ocr/pipeline';

/**
 * Phase 3 / PR3 — OCR extraction (R2 + threat matrix).
 *
 * The threat-matrix RED tests below run FOR REAL in this environment:
 *   - 3.5 a fake hanging binary is spawned (no shell) and the configured
 *     subprocess timeout SIGKILLs it.
 *   - 3.6 a deliberately-bogus binary path surfaces a graceful
 *     `OcrBinaryMissingError` (the env actually HAS tesseract at
 *     /home/linuxbrew/.linuxbrew/bin/tesseract, so the missing path must be
 *     constructed — the genuine ENOENT path is exercised).
 *   - 3.7 two different `OcrEngine` implementations produce the SAME persisted
 *     `extraction_results` shape (R2: engine is swappable).
 *
 * No DB / Supabase / Storage is touched by these tests; nothing is faked.
 */

const tmpPaths: string[] = [];
afterAll(async () => {
  await Promise.all(tmpPaths.map((p) => rm(p, { recursive: true, force: true })));
});

async function tmpDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  tmpPaths.push(dir);
  return dir;
}

async function makeHangingBinary(): Promise<string> {
  // Shebang points at the absolute node binary so execve honours it without PATH.
  const dir = await tmpDir('ocr-fake-hang-');
  const script = path.join(dir, 'hang-fake-tesseract');
  await writeFile(script, `#!${process.execPath}\nsetInterval(() => {}, 1000);\n`);
  await chmod(script, 0o755);
  return script;
}

async function makeInputFile(content = 'BANCO PICHINCHA\nVALOR: $ 1.234,56\n'): Promise<string> {
  const dir = await tmpDir('ocr-input-');
  const file = path.join(dir, 'input.txt');
  await writeFile(file, content);
  return file;
}

describe('parseReceiptFields — R2 hint extractor (pure unit)', () => {
  const sample = [
    'BANCO PICHINCHA',
    'PAGADOR: JUAN PEREZ',
    'FECHA: 14/03/2026',
    'VALOR: $ 1.234,56',
    'REFERENCIA: 8723498273',
    'CUENTA DESTINO: 0123456789',
  ].join('\n');

  it('populates every R2 field from a clear-image text sample', () => {
    const { fields, confidence } = parseReceiptFields(sample);
    expect(fields.bank).toBe('Pichincha');
    expect(fields.payer).toBe('JUAN PEREZ');
    expect(fields.date).toBe('14/03/2026');
    expect(fields.amount).toBe('1.234,56');
    expect(fields.reference).toBe('8723498273');
    expect(fields.destination_account).toBe('0123456789');
    for (const k of OCR_FIELD_KEYS) {
      expect(confidence[k]).toBe(0.7);
    }
  });

  it('leaves unmatched fields null on a poor-quality (mostly empty) sample', () => {
    const { fields, confidence } = parseReceiptFields('  ??? \n ||| \n');
    for (const k of OCR_FIELD_KEYS) {
      expect(fields[k]).toBeNull();
      expect(confidence[k]).toBeUndefined();
    }
  });
});

// --- Threat matrix: 3.5 — subprocess timeout fires on a hanging binary ---------

describe('3.5 — threat matrix: hanging subprocess → ocr_timeout', () => {
  let fakeBinary: string;
  let input: string;

  beforeAll(async () => {
    fakeBinary = await makeHangingBinary();
    input = await makeInputFile();
  });

  it('rejects with OcrTimeoutError when the subprocess exceeds its timeout', async () => {
    // A SHORT timeout (1000ms) exercises the SAME code path as the production
    // 25s default — proving the fire-and-kill mechanism without burning 25s in
    // the suite. The default is asserted separately below.
    const engine = new TesseractEngine({
      binaryPath: fakeBinary,
      timeoutMs: 1000,
      maxOutputBytes: 1024,
    });

    const start = Date.now();
    await expect(
      engine.extract({ path: input, mime: 'image/png' }),
    ).rejects.toBeInstanceOf(OcrTimeoutError);
    const elapsed = Date.now() - start;

    // Settled near the configured timeout, never near the 25s production default.
    expect(elapsed).toBeGreaterThanOrEqual(900);
    expect(elapsed).toBeLessThan(4000);
  });

  it('the production default timeout is 25_000ms per the threat matrix', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(25_000);
  });
});

// --- Threat matrix: 3.6 — missing binary → graceful error --------------------

describe('3.6 — threat matrix: missing binary → ocr_binary_missing (graceful)', () => {
  let input: string;

  beforeAll(async () => {
    input = await makeInputFile();
  });

  it('rejects with OcrBinaryMissingError (ENOENT) for a bogus binary path', async () => {
    const engine = new TesseractEngine({
      binaryPath: path.join(os.tmpdir(), `definitely-missing-${Math.random().toString(36).slice(2)}`),
      timeoutMs: 2000,
    });

    const p = engine.extract({ path: input, mime: 'image/png' });
    await expect(p).rejects.toBeInstanceOf(OcrBinaryMissingError);
    const err = await p.catch((e) => e);
    expect(isOcrExtractionError(err)).toBe(true);
    expect((err as OcrBinaryMissingError).code).toBe('ocr_binary_missing');
  });

it('does NOT spawn a shell (argv-only, no shell:true)', () => {
    // Static guard: the implementation may never gain `shell: true`. Verified
    // here by reading the module source — a regression that adds `shell: true`
    // would fail this assertion. Resolved relative to this test file (the vitest
    // `@` alias does not apply to Node's module resolution).
    const here = path.dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      path.resolve(here, '../../lib/ocr/tesseract.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/shell\s*:\s*true/);
    expect(src).toMatch(/shell\s*:\s*false/);
  });
});

// --- 3.7 — R2 RED: engine swap preserves the extraction contract ----------------

class MockOcrEngine implements OcrEngine {
  readonly name: string;
  constructor(name: string, private readonly out: OcrExtractionOutput) {
    this.name = name;
  }
  extract(): Promise<OcrExtractionOutput> {
    return Promise.resolve(this.out);
  }
}

describe('3.7 — R2 RED: engine swap preserves the extraction contract', () => {
  const fullOutput: OcrExtractionOutput = {
    fields: { bank: 'Pichincha', amount: '1.234,56', date: '14/03/2026', payer: 'JUAN PEREZ', reference: '8723498273', destination_account: '0123456789' },
    confidence: { bank: 0.7, amount: 0.7, date: 0.7, payer: 0.7, reference: 0.7, destination_account: 0.7 },
    rawText: 'raw',
  };
  const partialOutput: OcrExtractionOutput = {
    fields: { bank: null, amount: null, date: null, payer: null, reference: null, destination_account: null },
    confidence: {},
    rawText: '',
  };

  it('the persisted extraction_results shape is identical across engines', () => {
    const a = buildExtractionRow({
      receiptId: 'r1', tenantId: 't1', branchId: 'b1',
      engineName: 'mockA', output: fullOutput, status: classifyExtraction(fullOutput),
    });
    const b = buildExtractionRow({
      receiptId: 'r1', tenantId: 't1', branchId: 'b1',
      engineName: 'mockB', output: partialOutput, status: classifyExtraction(partialOutput),
    });

    // Same keys, in the same canonical order — the SHAPE does not depend on the
    // engine, only the values do (R2 swappable).
    expect(Object.keys(a)).toEqual(Object.keys(b));
    expect(Object.keys(a).sort()).toEqual(
      ['branch_id', 'confidence', 'engine_name', 'fields', 'raw_text', 'receipt_id', 'status', 'tenant_id'],
    );
    expect(a.engine_name).toBe('mockA');
    expect(b.engine_name).toBe('mockB');
    expect(a.fields).not.toBe(b.fields); // defensive copy, not shared ref
  });

  it('classifyExtraction reports complete iff every R2 field is present', () => {
    expect(classifyExtraction(fullOutput)).toBe('complete');
    expect(classifyExtraction(partialOutput)).toBe('partial');
    // engine swap gives the SAME classification for the SAME output
    const swap = new MockOcrEngine('other', fullOutput);
    return swap.extract().then((o) => expect(classifyExtraction(o)).toBe('complete'));
  });

  it('TesseractEngine conforms to the OcrEngine interface', () => {
    const e: OcrEngine = new TesseractEngine();
    expect(e.name).toBe('tesseract');
    expect(typeof e.extract).toBe('function');
  });

  it('getDefaultOcrEngine returns a Tesseract engine unless disabled', () => {
    const prev = process.env.OCR_ENGINE;
    try {
      process.env.OCR_ENGINE = 'none';
      expect(getDefaultOcrEngine()).toBeNull();
      delete process.env.OCR_ENGINE;
      const eng = getDefaultOcrEngine();
      expect(eng).not.toBeNull();
      expect(eng!.name).toBe('tesseract');
    } finally {
      if (prev !== undefined) process.env.OCR_ENGINE = prev;
    }
  });
});