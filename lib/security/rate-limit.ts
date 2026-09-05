interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class MemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  check(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();

    // Periodic cleanup of stale buckets every 5 minutes
    if (now - this.lastCleanup > 300_000) {
      this.cleanup(now);
    }

    let record = this.store.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, record);
      return { allowed: true, remaining: limit - 1, resetTime: record.resetTime };
    }

    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count += 1;
    return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
  }

  private cleanup(now: number) {
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
    this.lastCleanup = now;
  }

  reset() {
    this.store.clear();
    this.lastCleanup = Date.now();
  }
}

export const rateLimiter = new MemoryRateLimiter();
