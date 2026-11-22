/** Tip payout ledger, batching and reconciliation (T-5006). */

import type { TipAllocation } from './tip-allocation';

export type TipPayoutStatus = 'pending' | 'paid' | 'failed';

export interface TipPayoutEntry {
  readonly id: string;
  readonly barberId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly period: string;
  readonly status: TipPayoutStatus;
}

export interface TipPayoutTransfer {
  readonly barberId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly entryIds: readonly string[];
}

export interface TipPayoutPlan {
  readonly transfers: readonly TipPayoutTransfer[];
  /** Sub-threshold (or unpaid) entries kept for the next payout run. */
  readonly carriedOver: readonly TipPayoutEntry[];
  readonly totalMinor: number;
}

export interface TipReconciliation {
  readonly missingInLedger: readonly string[];
  readonly missingInPayout: readonly string[];
  readonly mismatched: readonly {
    readonly entryId: string;
    readonly ledgerMinor: number;
    readonly payoutMinor: number;
  }[];
}

/** Writes one immutable ledger entry per barber allocation; ids are deterministic. */
export function buildTipPayoutEntries(
  allocations: readonly TipAllocation[],
  period: string,
  currency: string
): TipPayoutEntry[] {
  return allocations
    .filter((allocation) => allocation.amountMinor > 0)
    .map((allocation) => ({
      id: `tip-${period}-${allocation.barberId}`,
      barberId: allocation.barberId,
      amountMinor: allocation.amountMinor,
      currency,
      period,
      status: 'pending',
    }));
}

/**
 * Groups pending entries per barber and currency into one transfer each,
 * carrying over balances below the Stripe Connect minimum transfer amount.
 */
export function planTipPayouts(
  entries: readonly TipPayoutEntry[],
  minimumTransferMinor = 0
): TipPayoutPlan {
  const threshold = Math.max(0, minimumTransferMinor);
  const groups = new Map<string, { barberId: string; currency: string; amountMinor: number; ids: string[] }>();

  for (const entry of entries) {
    if (entry.status !== 'pending') continue;
    const key = `${entry.currency}:${entry.barberId}`;
    const group = groups.get(key) ?? {
      barberId: entry.barberId,
      currency: entry.currency,
      amountMinor: 0,
      ids: [],
    };
    group.amountMinor += entry.amountMinor;
    group.ids.push(entry.id);
    groups.set(key, group);
  }

  const transfers: TipPayoutTransfer[] = [];
  const carriedOver: TipPayoutEntry[] = [];
  let totalMinor = 0;
  for (const group of [...groups.values()].sort((left, right) =>
    `${left.currency}:${left.barberId}`.localeCompare(`${right.currency}:${right.barberId}`)
  )) {
    if (group.amountMinor < threshold) {
      for (const entry of entries) {
        if (group.ids.includes(entry.id)) carriedOver.push(entry);
      }
      continue;
    }
    transfers.push({
      barberId: group.barberId,
      amountMinor: group.amountMinor,
      currency: group.currency,
      entryIds: group.ids,
    });
    totalMinor += group.amountMinor;
  }
  return { transfers, carriedOver, totalMinor };
}

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
