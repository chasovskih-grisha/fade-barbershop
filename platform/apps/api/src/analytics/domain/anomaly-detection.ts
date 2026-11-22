/** Rule-based revenue-integrity anomaly detection (T-5014). */

import {
  chargebackAnomaly,
  discountAnomaly,
  outlierAnomaly,
  refundAnomaly,
  unregisteredCashAnomaly,
} from './anomaly-rules';
import {
  DEFAULT_ANOMALY_POLICY,
  type Anomaly,
  type AnomalyPolicy,
  type Baseline,
  type DetectionContext,
  type TransactionSample,
} from './anomaly.types';

export type {
  Anomaly,
  AnomalyKind,
  AnomalyPolicy,
  AnomalySeverity,
  TransactionSample,
} from './anomaly.types';

export function summarizeAmounts(
  transactions: readonly TransactionSample[]
): Baseline {
  if (transactions.length === 0) return { meanMinor: 0, stdDevMinor: 0 };
  const mean =
    transactions.reduce((sum, tx) => sum + tx.amountMinor, 0) / transactions.length;
  const variance =
    transactions.reduce((sum, tx) => sum + (tx.amountMinor - mean) ** 2, 0) /
    transactions.length;
  return { meanMinor: mean, stdDevMinor: Math.sqrt(variance) };
}

function chargebacksByLocation(
  transactions: readonly TransactionSample[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.chargeback) continue;
    counts.set(tx.locationId, (counts.get(tx.locationId) ?? 0) + 1);
  }
  return counts;
}

function inspectTransaction(
  tx: TransactionSample,
  context: DetectionContext
): Anomaly[] {
  const checks = [
    discountAnomaly(tx, context.policy),
    unregisteredCashAnomaly(tx),
    refundAnomaly(tx, context.policy),
    chargebackAnomaly(tx, context),
    outlierAnomaly(tx, context),
  ];
  return checks.filter((found): found is Anomaly => found !== undefined);
}

export function detectAnomalies(
  transactions: readonly TransactionSample[],
  policy: AnomalyPolicy = DEFAULT_ANOMALY_POLICY
): Anomaly[] {
  const baseline = summarizeAmounts(transactions);
  const chargebacks = chargebacksByLocation(transactions);
  return transactions.flatMap((tx) =>
    inspectTransaction(tx, {
      policy,
      baseline,
      chargebackCount: chargebacks.get(tx.locationId) ?? 0,
    })
  );
}
