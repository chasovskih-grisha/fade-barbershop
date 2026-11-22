export enum PaymentStatus {
  AWAITING_DEPOSIT = 'awaiting_deposit',
  DEPOSIT_PAID = 'deposit_paid',
  AWAITING_BALANCE = 'awaiting_balance',
  PAID = 'paid',
  REFUNDING = 'refunding',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUNDED = 'refunded',
  REFUND_FAILED = 'refund_failed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum PaymentForm {
  CARD = 'card',
  CASH = 'cash',
  POS = 'pos',
  CERTIFICATE = 'certificate',
}

/**
 * Гроші вже списані або повернення вже почалося. Повторний deposit/on-site
 * виклик не має створювати другу оплату на цій самій стадії.
 * `REFUNDED` сюди не входить: повернені гроші більше не утримуються.
 */
const CAPTURED_PAYMENT_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.DEPOSIT_PAID,
  PaymentStatus.AWAITING_BALANCE,
  PaymentStatus.PAID,
  PaymentStatus.REFUNDING,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.REFUND_FAILED,
  PaymentStatus.DISPUTED,
]);

export function isCapturedPaymentStatus(status: PaymentStatus): boolean {
  return CAPTURED_PAYMENT_STATUSES.has(status);
}
