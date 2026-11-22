/** Tip pooling and automatic distribution rules (T-5006). */

export type TipPoolingBasis = 'hours' | 'service_revenue' | 'equal';

export type TipPoolingRule =
  | { readonly kind: 'individual' }
  | { readonly kind: 'pooled'; readonly basis: TipPoolingBasis }
  /** Keeps `1 - pooledShare` with the earner and pools the rest. */
  | { readonly kind: 'hybrid'; readonly basis: TipPoolingBasis; readonly pooledShare: number };

export interface TipContribution {
  readonly barberId: string;
  readonly amountMinor: number;
  readonly hoursWorked?: number;
  readonly serviceRevenueMinor?: number;
}

export interface TipAllocation {
  readonly barberId: string;
  readonly amountMinor: number;
}

function weightOf(contribution: TipContribution, basis: TipPoolingBasis): number {
  if (basis === 'equal') return 1;
  if (basis === 'hours') return Math.max(0, contribution.hoursWorked ?? 0);
  return Math.max(0, contribution.serviceRevenueMinor ?? 0);
}

/**
 * Splits a pool proportionally to each barber's weight using largest-remainder
 * rounding, so the allocations always sum exactly to the pool.
 */
export function splitPool(
  poolMinor: number,
  contributions: readonly TipContribution[],
  basis: TipPoolingBasis
): TipAllocation[] {
  const pool = Math.max(0, Math.round(poolMinor));
  if (contributions.length === 0) return [];
  const weights = contributions.map((contribution) => weightOf(contribution, basis));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const shares = contributions.map((contribution, index) => {
    const weight = totalWeight > 0 ? (weights[index] ?? 0) : 1;
    const divisor = totalWeight > 0 ? totalWeight : contributions.length;
    const exact = (weight / divisor) * pool;
    const whole = Math.floor(exact);
    return { barberId: contribution.barberId, amountMinor: whole, remainder: exact - whole, index };
  });

  const remainder = pool - shares.reduce((sum, share) => sum + share.amountMinor, 0);
  const order = [...shares].sort(
    (left, right) => right.remainder - left.remainder || left.index - right.index
  );
  for (let offset = 0; offset < remainder; offset += 1) {
    const target = order[offset % order.length];
    const share = target ? shares[target.index] : undefined;
    if (share) share.amountMinor += 1;
  }
  return shares.map(({ barberId, amountMinor }) => ({ barberId, amountMinor }));
}

/** Applies the shop's pooling rule to every tip taken in a shift. */
export function allocateTips(
  contributions: readonly TipContribution[],
  rule: TipPoolingRule
): TipAllocation[] {
  if (rule.kind === 'individual') {
    return contributions.map((contribution) => ({
      barberId: contribution.barberId,
      amountMinor: Math.max(0, Math.round(contribution.amountMinor)),
    }));
  }

  const pooledShare = rule.kind === 'pooled' ? 1 : Math.min(1, Math.max(0, rule.pooledShare));
  const direct = new Map<string, number>();
  let poolMinor = 0;
  for (const contribution of contributions) {
    const amount = Math.max(0, Math.round(contribution.amountMinor));
    const pooledPart = Math.floor(amount * pooledShare);
    poolMinor += pooledPart;
    direct.set(contribution.barberId, (direct.get(contribution.barberId) ?? 0) + (amount - pooledPart));
  }

  const allocations = new Map<string, number>(
    contributions.map((contribution) => [contribution.barberId, direct.get(contribution.barberId) ?? 0])
  );
  for (const share of splitPool(poolMinor, contributions, rule.basis)) {
    allocations.set(share.barberId, (allocations.get(share.barberId) ?? 0) + share.amountMinor);
  }
  return [...allocations.entries()]
    .map(([barberId, amountMinor]) => ({ barberId, amountMinor }))
    .sort((left, right) => left.barberId.localeCompare(right.barberId));
}
