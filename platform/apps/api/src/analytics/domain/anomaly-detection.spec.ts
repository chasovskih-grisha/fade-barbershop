import { detectAnomalies, type TransactionSample } from './anomaly-detection';
import { reconcilePayments } from './payment-reconciliation';

function tx(overrides: Partial<TransactionSample> & { id: string }): TransactionSample {
  return {
    locationId: 'loc-1',
    amountMinor: 1_000,
    discountMinor: 0,
    paymentMethod: 'card',
    registeredInPos: true,
    chargeback: false,
    occurredAt: new Date('2026-11-20T12:00:00Z'),
    ...overrides,
  };
}

describe('detectAnomalies (T-5014)', () => {
  it('flags excessive manual discounts and unregistered cash', () => {
    const anomalies = detectAnomalies([
      tx({ id: 't1', amountMinor: 400, discountMinor: 600 }),
      tx({ id: 't2', paymentMethod: 'cash', registeredInPos: false }),
    ]);

    expect(anomalies.map((a) => a.kind)).toEqual([
      'excessive_discount',
      'unregistered_cash',
    ]);
    expect(anomalies[0]?.severity).toBe('high');
    expect(anomalies[1]?.severity).toBe('high');
  });

  it('flags refund spikes and clustered chargebacks', () => {
    const anomalies = detectAnomalies([
      tx({ id: 't1', amountMinor: 1_000, refundedMinor: 800 }),
      tx({ id: 't2', chargeback: true }),
      tx({ id: 't3', chargeback: true }),
      tx({ id: 't4', chargeback: true }),
    ]);

    expect(anomalies.filter((a) => a.kind === 'refund_spike')).toHaveLength(1);
    expect(anomalies.filter((a) => a.kind === 'chargeback_velocity')).toHaveLength(3);
  });

  it('flags statistical amount outliers only when variance exists', () => {
    const baseline = Array.from({ length: 10 }, (_, index) =>
      tx({ id: `base-${index}`, amountMinor: 1_000 })
    );
    const outliers = detectAnomalies([...baseline, tx({ id: 'spike', amountMinor: 9_000 })]);
    expect(outliers.map((a) => a.transactionId)).toContain('spike');
    expect(detectAnomalies(baseline)).toHaveLength(0);
  });
});

describe('reconcilePayments (T-5014)', () => {
  const ledger = [
    { id: 'l1', amountMinor: 1_000, currency: 'USD', capturedAt: new Date(0) },
    { id: 'l2', amountMinor: 2_000, currency: 'USD', capturedAt: new Date(0) },
  ];

  it('matches payouts and reports uncovered ledger entries', () => {
    const result = reconcilePayments(ledger, [
      { id: 'p1', ledgerEntryId: 'l1', amountMinor: 1_000, currency: 'USD', paidAt: new Date(0) },
    ]);
    expect(result.matchedLedgerIds).toEqual(['l1']);
    expect(result.missingInPayout).toEqual(['l2']);
    expect(result.missingInLedger).toEqual([]);
  });

  it('reports orphan payouts and amount mismatches', () => {
    const result = reconcilePayments(ledger, [
      { id: 'p1', ledgerEntryId: 'l1', amountMinor: 900, currency: 'USD', paidAt: new Date(0) },
      { id: 'p2', ledgerEntryId: 'ghost', amountMinor: 500, currency: 'USD', paidAt: new Date(0) },
    ]);
    expect(result.amountMismatches).toEqual([
      { ledgerEntryId: 'l1', ledgerMinor: 1_000, payoutMinor: 900, currency: 'USD' },
    ]);
    expect(result.missingInLedger).toEqual(['p2']);
    expect(result.missingInPayout).toEqual(['l2']);
  });
});
