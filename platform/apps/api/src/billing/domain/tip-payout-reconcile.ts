/** Звірка журналу чайових із переказами (T-5006). */
import type { TipPayoutEntry, TipPayoutTransfer, TipReconciliation } from './tip-payout.types';

/**
 * Checks that every paid ledger entry is covered by exactly one transfer and
 * that transfer amounts match the covered entries.
 */
export function reconcileTipPayouts(
  entries: readonly TipPayoutEntry[],
  transfers: readonly TipPayoutTransfer[]
): TipReconciliation {
  const paid = new Map(
    entries.filter((entry) => entry.status === 'paid').map((entry) => [entry.id, entry])
  );
  const covered = new Set<string>();
  const missingInLedger: string[] = [];
  const mismatched: TipReconciliation['mismatched'][number][] = [];

  for (const transfer of transfers) {
    const matched = transfer.entryIds.flatMap((entryId) => {
      const entry = paid.get(entryId);
      if (!entry) {
        missingInLedger.push(entryId);
        return [];
      }
      covered.add(entryId);
      return [entry];
    });
    if (matched.length === 0) continue;
    const ledgerMinor = matched.reduce((sum, entry) => sum + entry.amountMinor, 0);
    const currencyMismatch = matched.some((entry) => entry.currency !== transfer.currency);
    if (ledgerMinor !== transfer.amountMinor || currencyMismatch) {
      mismatched.push({
        entryId: transfer.entryIds[0] ?? '',
        ledgerMinor,
        payoutMinor: transfer.amountMinor,
      });
    }
  }

  const missingInPayout = [...paid.keys()].filter((entryId) => !covered.has(entryId));

  return {
    missingInLedger: missingInLedger.sort(),
    missingInPayout: missingInPayout.sort(),
    mismatched: mismatched.sort((left, right) => left.entryId.localeCompare(right.entryId)),
  };
}
