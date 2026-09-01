import { describe, expect, it } from 'vitest';

describe('Client Portal Status Aggregation', () => {
  interface ClientReceipt {
    id: string;
    status: 'pending' | 'needs_review' | 'approved' | 'rejected';
    created_at: string;
  }

  function aggregateClientReceipts(receipts: ClientReceipt[]) {
    const counts = {
      total: receipts.length,
      pending: 0,
      needs_review: 0,
      approved: 0,
      rejected: 0,
    };

    for (const r of receipts) {
      if (r.status in counts) {
        counts[r.status]++;
      }
    }

    return counts;
  }

  it('aggregates client status counts accurately', () => {
    const receipts: ClientReceipt[] = [
      { id: '1', status: 'approved', created_at: '2026-09-01' },
      { id: '2', status: 'pending', created_at: '2026-09-01' },
      { id: '3', status: 'needs_review', created_at: '2026-09-01' },
      { id: '4', status: 'approved', created_at: '2026-09-01' },
      { id: '5', status: 'rejected', created_at: '2026-09-01' },
    ];

    const stats = aggregateClientReceipts(receipts);
    expect(stats.total).toBe(5);
    expect(stats.approved).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.needs_review).toBe(1);
    expect(stats.rejected).toBe(1);
  });
});
