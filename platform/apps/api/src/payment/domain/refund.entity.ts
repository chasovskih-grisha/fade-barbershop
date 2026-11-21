/** Refund entity (T-094): refund lifecycle and state machine.
 * Statuses: PENDING → PROCESSING → COMPLETED / FAILED
 * Idempotency: via refund_id; duplicate refunds return existing status.
 * Amount cap: never exceeds captured deposit + remainder amounts.
 * Timeline: allowed up to 7 days after booking DONE; 24h for no-show (T-095).
 */
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface RefundEntity {
  refundId: string; // UUID v7; immutable key
  bookingId: string;
  amount: number; // UAH (kopecks * 100, rounded to tens)
  reason: RefundReason;
  status: RefundStatus;
  initiatedAt: Date;
  completedAt?: Date;
  paymentMethod: 'cash' | 'card' | 'deposit' | 'walk-in';
  refundIdempotencyKey: string; // provided by caller; used for dedup
  reasonCode?: string; // admin panel code; PAY-004, NSH-ADM-04, etc.
  adminNote?: string; // internal audit log
  checksum: string; // SHA-256 of amount + bookingId + refundId + timestamp for integrity
}

export enum RefundReason {
  CANCELLATION = 'cancellation', // client cancelled ≥4h before
  NO_SHOW = 'no_show', // barber manually marks no-show
  ADMIN_WITHDRAWAL = 'admin_withdrawal', // admin cancelled booking
  FRAUD_PREVENTION = 'fraud_prevention', // suspicious activity
  DUPLICATE_BOOKING = 'duplicate_booking', // accidental double-booking
  SYSTEM_ERROR = 'system_error', // platform error refund
}

export interface RefundMetadata {
  clientId?: string;
  originalPaymentMethod?: 'cash' | 'card' | 'deposit' | 'walk-in';
  originalTransactionId?: string; // Checkbox check_id or payment gateway tx_id
  cancellationOffsetMinutes?: number; // how far before event cancellation/no-show
  scheduledStart?: Date; // original booking start time
  actualStart?: Date; // if partially used
}
