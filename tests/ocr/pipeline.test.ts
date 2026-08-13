import { describe, expect, it } from 'vitest';
import {
  TesseractEngine,
  OCR_FIELD_KEYS,
} from '@/lib/ocr/tesseract';
import {
  type OcrEngine,
  type OcrExtractionOutput,
} from '@/lib/ocr/engine';
import {
  buildExtractionRow,
  classifyExtraction,
} from '@/lib/ocr/pipeline';

/**
 * Phase 3 / PR3b — R2 RED: engine swap preserves the extraction contract.
 *
 * PR3 is split per maintainer approval (650-line budget): PR3a landed the DRIVER
 * threat-matrix tests (3.5 hanging subprocess → ocr_timeout, 3.6 missing binary
 * → ocr_binary_missing) + the pure field-parser unit and the driver's own
 * OcrEngine conformance / factory gating. PR3b (this file) carries the single
 * contract that depends on `lib/ocr/pipeline`: swapping the OcrEngine MUST NOT
 * change the persisted `extraction_results` shape — only the values.
 *
 * `buildExtractionRow` and `classifyExtraction` are PURE: they never touch the
 * engine instance beyond its declared `OcrEngine` shape, so two different
 * engines producing the SAME output map to the SAME row shape. No DB / Supabase
 * / Storage is touched; nothing is faked.
 *
 * Per the spec R2 "Engine swap" scenario: "New engine used; extraction contract
 * unchanged" — this is the RED test that would fail if a future engine refactor
 * leaked engine-specific keys into the persisted row.
 */

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
    fields: {
      bank: 'Pichincha',
      amount: '1.234,56',
      date: '14/03/2026',
      payer: 'JUAN PEREZ',
      reference: '8723498273',
      destination_account: '0123456789',
    },
    confidence: {
      bank: 0.7,
      amount: 0.7,
      date: 0.7,
      payer: 0.7,
      reference: 0.7,
      destination_account: 0.7,
    },
    rawText: 'raw',
  };
  const partialOutput: OcrExtractionOutput = {
    fields: {
      bank: null,
      amount: null,
      date: null,
      payer: null,
      reference: null,
      destination_account: null,
    },
    confidence: {},
    rawText: '',
  };

  it('the persisted extraction_results shape is identical across engines', () => {
    // Two DIFFERENT engines (mockA vs mockB) producing different outputs MUST
    // still persist the SAME row shape — engine identity only changes values.
    const a = buildExtractionRow({
      receiptId: 'r1',
      tenantId: 't1',
      branchId: 'b1',
      engineName: 'mockA',
      output: fullOutput,
      status: classifyExtraction(fullOutput),
    });
    const b = buildExtractionRow({
      receiptId: 'r1',
      tenantId: 't1',
      branchId: 'b1',
      engineName: 'mockB',
      output: partialOutput,
      status: classifyExtraction(partialOutput),
    });

    // Same keys, in the same canonical order — the SHAPE does not depend on the
    // engine, only the values do (R2 swappable).
    expect(Object.keys(a)).toEqual(Object.keys(b));
    expect(Object.keys(a).sort()).toEqual([
      'branch_id',
      'confidence',
      'engine_name',
      'fields',
      'raw_text',
      'receipt_id',
      'status',
      'tenant_id',
    ]);
    expect(a.engine_name).toBe('mockA');
    expect(b.engine_name).toBe('mockB');
    // Defensive copy, not a shared reference — a hostile/mutating engine cannot
    // corrupt a previously-persisted row.
    expect(a.fields).not.toBe(b.fields);
  });

  it('classifyExtraction reports complete iff every R2 field is present', () => {
    expect(classifyExtraction(fullOutput)).toBe('complete');
    expect(classifyExtraction(partialOutput)).toBe('partial');
    // Engine swap gives the SAME classification for the SAME output — the
    // classifier never inspects `engine.name`, so an engine swap is invisible.
    const swap = new MockOcrEngine('other', fullOutput);
    return swap.extract().then((o) => expect(classifyExtraction(o)).toBe('complete'));
  });

  it('buildExtractionRow copies fields/confidence defensively across engine outputs', () => {
    const engine = new MockOcrEngine('mutatingEngine', fullOutput);
    return engine.extract().then((output) => {
      const row = buildExtractionRow({
        receiptId: 'r2',
        tenantId: 't2',
        branchId: 'b2',
        engineName: engine.name,
        output,
        status: 'complete',
      });
      // Mutating the engine's returned output AFTER buildExtractionRow must not
      // change the persisted row. This is the R2 swap-safety guarantee.
      output.fields.bank = 'TAMPERED';
      output.confidence.bank = -1;
      expect(row.fields.bank).toBe('Pichincha');
      expect(row.confidence.bank).toBe(0.7);
    });
  });

  it('classifyExtraction is engine-agnostic for partial outputs from a non-Tesseract engine', () => {
    const aDifferentEngine = new MockOcrEngine('cloudOcr', partialOutput);
    return aDifferentEngine.extract().then((o) => {
      expect(classifyExtraction(o)).toBe('partial');
      // Sanity: every R2 field key is null in a partial output.
      for (const k of OCR_FIELD_KEYS) {
        expect(o.fields[k]).toBeNull();
      }
    });
  });

  it('TesseractEngine (the v1 default) still satisfies the same contract a MockOcrEngine does', () => {
    // Belts-and-braces: the real driver and a mock both quack `OcrEngine`, so
    // buildExtractionRow accepts either with no shape divergence. This bridges
    // PR3a's driver-conformance test (which lives in tesseract.test.ts) and the
    // pipeline contract here.
    const real: OcrEngine = new TesseractEngine();
    const mock: OcrEngine = new MockOcrEngine('mock', fullOutput);
    expect(typeof real.extract).toBe('function');
    expect(typeof mock.extract).toBe('function');
    expect(real.name).toBe('tesseract');
    expect(mock.name).toBe('mock');
  });
});