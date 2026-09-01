import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleBranchIds } from '@/lib/tenancy/branch';
import { generateReceiptsCsv, ExportReceiptRow } from '@/lib/export/csv';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');
  const status = searchParams.get('status');
  const fraud = searchParams.get('fraud');

  const branchIds = await getAccessibleBranchIds(supabase);
  if (!branchIds || branchIds.length === 0) {
    return new NextResponse(generateReceiptsCsv([]), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="receipts-export.csv"',
      },
    });
  }

  let query = supabase
    .from('receipts')
    .select(
      'id, created_at, branch_id, status, fraud_flag, uploaded_by, reviewed_by, reviewed_at, rejection_reason, branches(name, code), extraction_results(fields), qr_verifications(bank, status)',
    )
    .in('branch_id', branchIds)
    .order('created_at', { ascending: false });

  if (branchId && branchId !== 'all') {
    query = query.eq('branch_id', branchId);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (fraud === '1') {
    query = query.eq('fraud_flag', true);
  }

  const { data: receipts, error } = await query;
  if (error) {
    return new NextResponse(`Database error: ${error.message}`, { status: 500 });
  }

  const rows: ExportReceiptRow[] = (receipts || []).map((r) => {
    const branch = Array.isArray(r.branches) ? r.branches[0] : r.branches;
    const extraction = Array.isArray(r.extraction_results) ? r.extraction_results[0] : r.extraction_results;
    const fields = (extraction?.fields as Record<string, string>) || {};
    const qr = Array.isArray(r.qr_verifications) ? r.qr_verifications[0] : r.qr_verifications;

    return {
      id: r.id,
      createdAt: r.created_at,
      branchName: branch?.name || '',
      branchCode: branch?.code || '',
      bank: fields.bank || qr?.bank || 'unknown',
      amount: fields.amount || '',
      payer: fields.payer || '',
      reference: fields.reference || '',
      destinationAccount: fields.destination_account || '',
      status: r.status,
      qrStatus: qr?.status || 'unprocessed',
      beneficiaryMatch: fields.destination_account ? 'matched' : 'unverified',
      fraudFlag: Boolean(r.fraud_flag),
      uploadedBy: r.uploaded_by || '',
      reviewedBy: r.reviewed_by || '',
      reviewedAt: r.reviewed_at || '',
      rejectionReason: r.rejection_reason || '',
    };
  });

  const csvContent = generateReceiptsCsv(rows);
  const now = new Date().toISOString().slice(0, 10);

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="receipts-export-${now}.csv"`,
    },
  });
}
