/** Tip payout ledger, batching and reconciliation (T-5006).
 *
 * Публічний шлях модуля: типи — tip-payout.types.ts, звірка —
 * tip-payout-reconcile.ts; журнал і планування виплат лишаються тут.
 */
import type { TipAllocation } from './tip-allocation';
import type { TipPayoutEntry, TipPayoutPlan, TipPayoutTransfer } from './tip-payout.types';

export { reconcileTipPayouts } from './tip-payout-reconcile';
export type {
  TipPayoutEntry,
  TipPayoutPlan,
  TipPayoutStatus,
  TipPayoutTransfer,
  TipReconciliation,
} from './tip-payout.types';

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

interface PayoutGroup {
  readonly barberId: string;
  readonly currency: string;
  amountMinor: number;
  readonly ids: string[];
}

/** Pending entries grouped per barber and currency — one transfer each. */
function groupPending(entries: readonly TipPayoutEntry[]): Map<string, PayoutGroup> {
  const groups = new Map<string, PayoutGroup>();
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
  return groups;
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
  const groups = groupPending(entries);
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
