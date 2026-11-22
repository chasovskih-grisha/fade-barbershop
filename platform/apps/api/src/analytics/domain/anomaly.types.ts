/** Transaction anomaly vocabulary and thresholds (T-5014). */

export type AnomalyKind =
  | 'excessive_discount'
  | 'unregistered_cash'
  | 'refund_spike'
  | 'chargeback_velocity'
  | 'amount_outlier';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface TransactionSample {
  readonly id: string;
  readonly locationId: string;
  readonly barberId?: string;
  readonly amountMinor: number;
  readonly discountMinor: number;
  readonly refundedMinor?: number;
  readonly paymentMethod: 'card' | 'cash' | 'other';
  readonly registeredInPos: boolean;
  readonly chargeback: boolean;
  readonly occurredAt: Date;
}

export interface AnomalyPolicy {
  readonly discountRateThreshold: number;
  readonly refundRateThreshold: number;
  readonly chargebackCountThreshold: number;
  readonly zScoreThreshold: number;
}

export const DEFAULT_ANOMALY_POLICY: AnomalyPolicy = {
  discountRateThreshold: 0.4,
  refundRateThreshold: 0.5,
  chargebackCountThreshold: 3,
  zScoreThreshold: 3,
};

/** A discount above half the bill is treated as high risk, not merely medium. */
export const HIGH_DISCOUNT_RATE = 0.5;

export interface Anomaly {
  readonly kind: AnomalyKind;
  readonly severity: AnomalySeverity;
  readonly transactionId: string;
  readonly locationId: string;
  readonly detail: string;
}

export interface Baseline {
  readonly meanMinor: number;
  readonly stdDevMinor: number;
}

export interface DetectionContext {
  readonly policy: AnomalyPolicy;
  readonly baseline: Baseline;
  readonly chargebackCount: number;
}
