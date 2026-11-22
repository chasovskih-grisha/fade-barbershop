/** Daily payment-gateway reconciliation against the booking ledger (T-5014). */

export interface LedgerEntry {
  readonly id: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly capturedAt: Date;
}

export interface PayoutRecord {
  readonly id: string;
  readonly ledgerEntryId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly paidAt: Date;
}

export interface AmountMismatch {
  readonly ledgerEntryId: string;
  readonly ledgerMinor: number;
  readonly payoutMinor: number;
  readonly currency: string;
}

export interface ReconciliationResult {
  readonly matchedLedgerIds: readonly string[];
  readonly missingInPayout: readonly string[];
  readonly missingInLedger: readonly string[];
  readonly amountMismatches: readonly AmountMismatch[];
}

/** Every captured ledger entry must appear in exactly one payout with equal value. */
export function reconcilePayments(
  ledger: readonly LedgerEntry[],
  payouts: readonly PayoutRecord[]
): ReconciliationResult {
  const ledgerById = new Map(ledger.map((entry) => [entry.id, entry]));
  const matched = new Set<string>();
  const missingInLedger: string[] = [];
  const amountMismatches: AmountMismatch[] = [];

  for (const payout of payouts) {
    const entry = ledgerById.get(payout.ledgerEntryId);
    if (!entry) {
      missingInLedger.push(payout.id);
      continue;
    }
    matched.add(entry.id);
    if (entry.amountMinor !== payout.amountMinor || entry.currency !== payout.currency) {
      amountMismatches.push({
        ledgerEntryId: entry.id,
        ledgerMinor: entry.amountMinor,
        payoutMinor: payout.amountMinor,
        currency: entry.currency,
      });
    }
  }

  return {
    matchedLedgerIds: [...matched],
    missingInPayout: ledger.filter((entry) => !matched.has(entry.id)).map((entry) => entry.id),
    missingInLedger,
    amountMismatches,
  };
}
