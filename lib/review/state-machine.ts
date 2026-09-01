/**
 * R6: Receipt State Machine
 *
 * Allowed statuses:
 * - pending: newly uploaded receipt awaiting automatic/manual processing
 * - needs_review: flagged for human inspection (e.g. signature mismatch, low OCR confidence)
 * - approved: terminal valid state confirmed by human reviewer (second-person)
 * - rejected: terminal invalid state rejected by human reviewer with reason
 */

export type ReceiptStatus = 'pending' | 'needs_review' | 'approved' | 'rejected';

const VALID_TRANSITIONS: Record<ReceiptStatus, readonly ReceiptStatus[]> = {
  pending: ['needs_review', 'approved', 'rejected'],
  needs_review: ['approved', 'rejected'],
  approved: [],
  rejected: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition receipt from '${from}' to '${to}'`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function isValidTransition(from: ReceiptStatus, to: ReceiptStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function assertValidTransition(from: ReceiptStatus, to: ReceiptStatus): void {
  if (!isValidTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}
