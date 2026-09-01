import { describe, expect, it } from 'vitest';
import {
  isValidTransition,
  assertValidTransition,
  InvalidStateTransitionError,
  ReceiptStatus,
} from '@/lib/review/state-machine';

describe('Receipt State Machine (R6)', () => {
  it('allows valid transitions from pending', () => {
    expect(isValidTransition('pending', 'needs_review')).toBe(true);
    expect(isValidTransition('pending', 'approved')).toBe(true);
    expect(isValidTransition('pending', 'rejected')).toBe(true);
  });

  it('allows valid transitions from needs_review', () => {
    expect(isValidTransition('needs_review', 'approved')).toBe(true);
    expect(isValidTransition('needs_review', 'rejected')).toBe(true);
  });

  it('blocks transitions from terminal states', () => {
    expect(isValidTransition('approved', 'pending')).toBe(false);
    expect(isValidTransition('approved', 'rejected')).toBe(false);
    expect(isValidTransition('rejected', 'approved')).toBe(false);
    expect(isValidTransition('rejected', 'pending')).toBe(false);
  });

  it('assertValidTransition throws InvalidStateTransitionError on invalid transition', () => {
    expect(() => assertValidTransition('approved', 'needs_review')).toThrow(
      InvalidStateTransitionError,
    );
  });
});
