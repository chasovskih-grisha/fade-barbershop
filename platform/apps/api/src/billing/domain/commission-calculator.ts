/** Tiered, flat and retail-kickback commission calculation (T-5022). */

import type {
  CommissionRateCard,
  CommissionRule,
  CommissionTier,
  SaleLine,
} from './commission.types';

export interface CommissionEntry {
  readonly lineId: string;
  readonly barberId: string;
  readonly ruleId: string;
  readonly baseMinor: number;
  readonly commissionMinor: number;
}

export interface TeamShare {
  readonly barberId: string;
  readonly weight: number;
}

export interface TeamSplit {
  readonly barberId: string;
  readonly amountMinor: number;
}

/** Progressive bands: lower bands are paid at their own rate, not the top rate. */
export function computeTieredCommission(
  baseMinor: number,
  tiers: readonly CommissionTier[]
): number {
  let remaining = Math.max(0, baseMinor);
  let lowerBound = 0;
  let total = 0;
  for (const tier of tiers) {
    const upperBound = tier.upToMinor ?? Number.POSITIVE_INFINITY;
    const band = Math.min(remaining, Math.max(0, upperBound - lowerBound));
    if (band > 0) {
      total += band * tier.rate;
      remaining -= band;
    }
    lowerBound = upperBound;
    if (remaining <= 0) break;
  }
  return Math.round(total);
}

function commissionForLine(line: SaleLine, rule: CommissionRule): number {
  if (rule.kind === 'flat') return Math.round(line.listAmountMinor * rule.rate);
  if (rule.kind === 'tiered') {
    return computeTieredCommission(line.listAmountMinor, rule.tiers);
  }
  return line.kind === 'product' ? rule.fixedMinor : 0;
}

function ruleForLine(line: SaleLine, rateCard: CommissionRateCard): CommissionRule {
  return rateCard.byReference[line.referenceId] ?? rateCard.byKind[line.kind];
}

/** One ledger entry per sold line, using the most specific rule available. */
export function calculateCommissions(
  rateCard: CommissionRateCard,
  lines: readonly SaleLine[]
): readonly CommissionEntry[] {
  return lines.map((line) => {
    const rule = ruleForLine(line, rateCard);
    return {
      lineId: line.id,
      barberId: line.barberId,
      ruleId: rule.id,
      baseMinor: line.listAmountMinor,
      commissionMinor: Math.max(0, commissionForLine(line, rule)),
    };
  });
}

/** Splits a team commission by weight (hours or revenue); remainder keeps total exact. */
export function splitTeamCommission(
  totalMinor: number,
  shares: readonly TeamShare[]
): readonly TeamSplit[] {
  const totalWeight = shares.reduce((sum, share) => sum + Math.max(0, share.weight), 0);
  if (totalWeight <= 0 || totalMinor <= 0) {
    return shares.map((share) => ({ barberId: share.barberId, amountMinor: 0 }));
  }
  const split = shares.map((share, index) => {
    const exact = (Math.max(0, share.weight) / totalWeight) * totalMinor;
    return { barberId: share.barberId, amountMinor: Math.floor(exact), index };
  });
  const remainder = totalMinor - split.reduce((sum, share) => sum + share.amountMinor, 0);
  const order = [...shares.keys()].sort(
    (left, right) =>
      Math.max(0, shares[right]?.weight ?? 0) - Math.max(0, shares[left]?.weight ?? 0) ||
      left - right
  );
  for (let offset = 0; offset < remainder; offset += 1) {
    const target = order[offset % order.length];
    const share = target === undefined ? undefined : split[target];
    if (share) share.amountMinor += 1;
  }
  return split.map(({ barberId, amountMinor }) => ({ barberId, amountMinor }));
}
