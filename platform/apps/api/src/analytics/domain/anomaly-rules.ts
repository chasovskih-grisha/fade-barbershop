/** Individual revenue-integrity rules (T-5014). */

import {
  HIGH_DISCOUNT_RATE,
  type Anomaly,
  type AnomalyPolicy,
  type DetectionContext,
  type TransactionSample,
} from './anomaly.types';

interface Finding {
  readonly kind: Anomaly['kind'];
  readonly severity: Anomaly['severity'];
  readonly detail: string;
}

function ratio(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

function anomaly(tx: TransactionSample, finding: Finding): Anomaly {
  return { ...finding, transactionId: tx.id, locationId: tx.locationId };
}

export function discountAnomaly(
  tx: TransactionSample,
  policy: AnomalyPolicy
): Anomaly | undefined {
  const rate = ratio(tx.discountMinor, tx.amountMinor + tx.discountMinor);
  if (rate <= policy.discountRateThreshold) return undefined;
  return anomaly(tx, {
    kind: 'excessive_discount',
    severity: rate > HIGH_DISCOUNT_RATE ? 'high' : 'medium',
    detail: `discount ${(rate * 100).toFixed(1)}% of bill`,
  });
}

export function unregisteredCashAnomaly(tx: TransactionSample): Anomaly | undefined {
  if (tx.paymentMethod !== 'cash' || tx.registeredInPos) return undefined;
  return anomaly(tx, {
    kind: 'unregistered_cash',
    severity: 'high',
    detail: 'cash payment missing from POS ledger',
  });
}

export function refundAnomaly(
  tx: TransactionSample,
  policy: AnomalyPolicy
): Anomaly | undefined {
  const rate = ratio(tx.refundedMinor ?? 0, tx.amountMinor);
  if (rate <= policy.refundRateThreshold) return undefined;
  return anomaly(tx, {
    kind: 'refund_spike',
    severity: 'medium',
    detail: `refunded ${(rate * 100).toFixed(1)}% of charge`,
  });
}

export function chargebackAnomaly(
  tx: TransactionSample,
  context: DetectionContext
): Anomaly | undefined {
  if (!tx.chargeback || context.chargebackCount < context.policy.chargebackCountThreshold) {
    return undefined;
  }
  return anomaly(tx, {
    kind: 'chargeback_velocity',
    severity: 'high',
    detail: `${context.chargebackCount} chargebacks at this location`,
  });
}

export function outlierAnomaly(
  tx: TransactionSample,
  context: DetectionContext
): Anomaly | undefined {
  if (context.baseline.stdDevMinor <= 0) return undefined;
  const zScore = (tx.amountMinor - context.baseline.meanMinor) / context.baseline.stdDevMinor;
  if (Math.abs(zScore) < context.policy.zScoreThreshold) return undefined;
  return anomaly(tx, {
    kind: 'amount_outlier',
    severity: 'medium',
    detail: `amount z-score ${zScore.toFixed(2)}`,
  });
}
