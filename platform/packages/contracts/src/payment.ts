/** Shared payment contracts: one shape for the booking deposit result and hold. */

export interface ConfirmedBooking {
  id: string;
  deposit?: { amount: number; expiresAt: string; serverNow: string; resumeToken?: string };
}

export type DepositPaymentOutcome =
  'captured' | 'already_paid' | 'pending' | 'failed' | 'expired' | 'unknown';

export interface DepositPayment {
  bookingId: string;
  outcome: DepositPaymentOutcome;
  paymentId: string | null;
  depositAmount: number;
  requiresBalance: boolean;
  receiptId: string | null;
  failureReason: string | null;
  /** Server hold deadline for resuming after a closed tab. */
  expiresAt?: string | null;
}

export type DepositHoldStatus =
  | { status: 'payable'; amount: number; expiresAt: string; serverNow: string }
  | { status: 'paid'; serverNow: string }
  | { status: 'expired'; serverNow: string };

export function isDepositHoldStatus(value: unknown): value is DepositHoldStatus {
  if (typeof value !== 'object' || value === null || !('status' in value)) return false;
  const status = (value as { status?: unknown }).status;
  return status === 'payable' || status === 'paid' || status === 'expired';
}

/** Maps the read-only hold contract to the payment-result contract. */
export function depositHoldToPayment(bookingId: string, status: DepositHoldStatus): DepositPayment {
  if (status.status === 'paid') {
    return {
      bookingId,
      outcome: 'already_paid',
      paymentId: null,
      depositAmount: 0,
      requiresBalance: false,
      receiptId: null,
      failureReason: null,
    };
  }
  if (status.status === 'expired') {
    return {
      bookingId,
      outcome: 'expired',
      paymentId: null,
      depositAmount: 0,
      requiresBalance: false,
      receiptId: null,
      failureReason: null,
      expiresAt: null,
    };
  }
  return {
    bookingId,
    outcome: 'pending',
    paymentId: null,
    depositAmount: status.amount,
    requiresBalance: false,
    receiptId: null,
    failureReason: null,
    expiresAt: status.expiresAt,
  };
}
