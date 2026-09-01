/**
 * R11: CSV Export Generator for Receipts
 * Columns required:
 * Receipt ID, Created At, Branch Name, Branch Code, Bank, Amount, Payer,
 * Reference, Destination Account, Status, QR Status, Beneficiary Match,
 * Fraud Flag (R4), Uploaded By, Reviewed By, Reviewed At, Rejection Reason.
 */

export interface ExportReceiptRow {
  id: string;
  createdAt: string;
  branchName: string;
  branchCode: string;
  bank: string;
  amount: string;
  payer: string;
  reference: string;
  destinationAccount: string;
  status: string;
  qrStatus: string;
  beneficiaryMatch: string;
  fraudFlag: boolean;
  uploadedBy: string;
  reviewedBy: string;
  reviewedAt: string;
  rejectionReason: string;
}

const HEADERS = [
  'Receipt ID',
  'Created At',
  'Branch Name',
  'Branch Code',
  'Bank',
  'Amount',
  'Payer',
  'Reference',
  'Destination Account',
  'Status',
  'QR Status',
  'Beneficiary Match',
  'Fraud Flag',
  'Uploaded By',
  'Reviewed By',
  'Reviewed At',
  'Rejection Reason',
];

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateReceiptsCsv(rows: ExportReceiptRow[]): string {
  const lines: string[] = [];
  lines.push(HEADERS.map(escapeCsvField).join(','));

  for (const r of rows) {
    const values = [
      r.id,
      r.createdAt,
      r.branchName,
      r.branchCode,
      r.bank,
      r.amount,
      r.payer,
      r.reference,
      r.destinationAccount,
      r.status,
      r.qrStatus,
      r.beneficiaryMatch,
      r.fraudFlag ? 'true' : 'false',
      r.uploadedBy,
      r.reviewedBy,
      r.reviewedAt,
      r.rejectionReason,
    ];
    lines.push(values.map(escapeCsvField).join(','));
  }

  return lines.join('\n');
}
