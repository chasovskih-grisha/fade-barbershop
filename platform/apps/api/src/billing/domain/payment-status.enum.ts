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
