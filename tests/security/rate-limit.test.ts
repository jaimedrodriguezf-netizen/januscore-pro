import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRateLimiter } from '@/lib/security/rate-limit';

describe('MemoryRateLimiter', () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    limiter = new MemoryRateLimiter();
  });

  it('allows requests under the limit', () => {
    const res1 = limiter.check('ip-123', 3, 60_000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check('ip-123', 3, 60_000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check('ip-123', 3, 60_000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('blocks requests exceeding the limit', () => {
    limiter.check('ip-bad', 2, 60_000);
    limiter.check('ip-bad', 2, 60_000);

    const blocked = limiter.check('ip-bad', 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('isolates different IP addresses', () => {
    limiter.check('ip-a', 1, 60_000);
    const blockedA = limiter.check('ip-a', 1, 60_000);
    expect(blockedA.allowed).toBe(false);

    const allowedB = limiter.check('ip-b', 1, 60_000);
    expect(allowedB.allowed).toBe(true);
  });

  it('resets after window expiry', async () => {
    limiter.check('ip-quick', 1, 50); // 50ms window
    expect(limiter.check('ip-quick', 1, 50).allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));

    const afterExpiry = limiter.check('ip-quick', 1, 50);
    expect(afterExpiry.allowed).toBe(true);
  });
});
