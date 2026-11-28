/** Типи журналу виплат чайових і звірки (T-5006). */

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
