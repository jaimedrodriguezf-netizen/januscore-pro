import { describe, expect, it } from 'vitest';
import { generateReceiptsCsv, ExportReceiptRow } from '@/lib/export/csv';

describe('CSV Export Generator (R4, R11)', () => {
  const rows: ExportReceiptRow[] = [
    {
      id: 'receipt-uuid-1',
      createdAt: '2026-08-12T10:00:00Z',
      branchName: 'Matriz Norte',
      branchCode: 'UIO-01',
      bank: 'Pichincha',
      amount: '125.50',
      payer: 'Juan Perez',
      reference: 'REF-9988',
      destinationAccount: '2200112233',
      status: 'approved',
      qrStatus: 'verified',
      beneficiaryMatch: 'true',
      fraudFlag: false,
      uploadedBy: 'user-1',
      reviewedBy: 'user-2',
      reviewedAt: '2026-08-12T11:00:00Z',
      rejectionReason: '',
    },
    {
      id: 'receipt-uuid-2',
      createdAt: '2026-08-12T12:00:00Z',
      branchName: 'Sucursal Guayaquil, Centro',
      branchCode: 'GYE-01',
      bank: 'Pichincha',
      amount: '500.00',
      payer: 'Carlos Sanchez "El Primo"',
      reference: 'REF-7766',
      destinationAccount: '9900112233',
      status: 'rejected',
      qrStatus: 'failed',
      beneficiaryMatch: 'false',
      fraudFlag: true,
      uploadedBy: 'user-3',
      reviewedBy: 'user-2',
      reviewedAt: '2026-08-12T13:00:00Z',
      rejectionReason: 'Invalid signature, fake photo',
    },
  ];

  it('6.5 & 6.6: includes all R11 columns with headers and proper escaping', () => {
    const csv = generateReceiptsCsv(rows);
    const lines = csv.split('\n');

    expect(lines[0]).toBe(
      'Receipt ID,Created At,Branch Name,Branch Code,Bank,Amount,Payer,Reference,Destination Account,Status,QR Status,Beneficiary Match,Fraud Flag,Uploaded By,Reviewed By,Reviewed At,Rejection Reason',
    );

    // Row 1 assertions
    expect(lines[1]).toContain('receipt-uuid-1');
    expect(lines[1]).toContain('Matriz Norte');
    expect(lines[1]).toContain('125.50');
    expect(lines[1]).toContain('verified');
    expect(lines[1]).toContain('false'); // fraudFlag: false

    // Row 2 assertions (with quotes escaping for commas and quotes in values)
    expect(lines[2]).toContain('receipt-uuid-2');
    expect(lines[2]).toContain('"Sucursal Guayaquil, Centro"');
    expect(lines[2]).toContain('"Carlos Sanchez ""El Primo"""');
    expect(lines[2]).toContain('true'); // fraudFlag: true (R4)
    expect(lines[2]).toContain('"Invalid signature, fake photo"');
  });
});
