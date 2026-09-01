/**
 * R10: Branch Metrics Aggregation
 */

export interface RawMetricReceipt {
  id: string;
  branch_id: string;
  status: string;
  fraud_flag: boolean;
  qr_status?: string | null;
}

export interface BranchMetricsResult {
  totalReceipts: number;
  statusCounts: {
    pending: number;
    needs_review: number;
    approved: number;
    rejected: number;
  };
  fraudCount: number;
  fraudRatePercent: number;
  qrVerifiedCount: number;
  qrVerifiedRatePercent: number;
}

export function calculateBranchMetrics(
  receipts: RawMetricReceipt[],
): BranchMetricsResult {
  const total = receipts.length;
  const statusCounts = {
    pending: 0,
    needs_review: 0,
    approved: 0,
    rejected: 0,
  };

  let fraudCount = 0;
  let qrVerifiedCount = 0;

  for (const r of receipts) {
    if (r.status in statusCounts) {
      statusCounts[r.status as keyof typeof statusCounts]++;
    }
    if (r.fraud_flag) {
      fraudCount++;
    }
    if (r.qr_status === 'verified') {
      qrVerifiedCount++;
    }
  }

  const fraudRatePercent = total > 0 ? (fraudCount / total) * 100 : 0;
  const qrVerifiedRatePercent = total > 0 ? (qrVerifiedCount / total) * 100 : 0;

  return {
    totalReceipts: total,
    statusCounts,
    fraudCount,
    fraudRatePercent,
    qrVerifiedCount,
    qrVerifiedRatePercent,
  };
}
