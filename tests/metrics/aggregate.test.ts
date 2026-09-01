import { describe, expect, it } from 'vitest';
import { calculateBranchMetrics, RawMetricReceipt } from '@/lib/metrics/aggregate';

describe('Branch Metrics Aggregator (R10)', () => {
  it('calculates status counts, fraud flag count/rate, and QR verification rate', () => {
    const rawReceipts: RawMetricReceipt[] = [
      {
        id: 'r1',
        branch_id: 'b1',
        status: 'approved',
        fraud_flag: false,
        qr_status: 'verified',
      },
      {
        id: 'r2',
        branch_id: 'b1',
        status: 'rejected',
        fraud_flag: true,
        qr_status: 'failed',
      },
      {
        id: 'r3',
        branch_id: 'b1',
        status: 'needs_review',
        fraud_flag: false,
        qr_status: 'unsupported',
      },
      {
        id: 'r4',
        branch_id: 'b1',
        status: 'pending',
        fraud_flag: false,
        qr_status: null,
      },
    ];

    const metrics = calculateBranchMetrics(rawReceipts);

    expect(metrics.totalReceipts).toBe(4);
    expect(metrics.statusCounts).toEqual({
      pending: 1,
      needs_review: 1,
      approved: 1,
      rejected: 1,
    });
    expect(metrics.fraudCount).toBe(1);
    expect(metrics.fraudRatePercent).toBe(25); // 1 / 4 * 100
    expect(metrics.qrVerifiedCount).toBe(1);
    expect(metrics.qrVerifiedRatePercent).toBe(25); // 1 / 4 * 100
  });

  it('handles empty receipt list safely (zero division protection)', () => {
    const metrics = calculateBranchMetrics([]);

    expect(metrics.totalReceipts).toBe(0);
    expect(metrics.statusCounts).toEqual({
      pending: 0,
      needs_review: 0,
      approved: 0,
      rejected: 0,
    });
    expect(metrics.fraudCount).toBe(0);
    expect(metrics.fraudRatePercent).toBe(0);
    expect(metrics.qrVerifiedCount).toBe(0);
    expect(metrics.qrVerifiedRatePercent).toBe(0);
  });
});
