/** Commission rules, sale lines and proportional bundle attribution (T-5022). */

export interface CommissionTier {
  /** Inclusive upper bound of the band; null = final open-ended band. */
  readonly upToMinor: number | null;
  readonly rate: number;
}

export type CommissionRule =
  | { readonly id: string; readonly kind: 'flat'; readonly rate: number }
  | { readonly id: string; readonly kind: 'tiered'; readonly tiers: readonly CommissionTier[] }
  | { readonly id: string; readonly kind: 'retail_kickback'; readonly fixedMinor: number };

export type SaleLineKind = 'service' | 'product';

export interface SaleLine {
  readonly id: string;
  readonly kind: SaleLineKind;
  readonly barberId: string;
  /** Service id or product id used to look up the commission rule. */
  readonly referenceId: string;
  readonly listAmountMinor: number;
}

export interface CommissionRateCard {
  readonly byReference: Readonly<Record<string, CommissionRule>>;
  readonly byKind: Readonly<Record<SaleLineKind, CommissionRule>>;
}

export interface BundleAttribution {
  readonly lineId: string;
  readonly attributedMinor: number;
}

/**
 * Splits a bundle price across its lines in proportion to list price using
 * largest-remainder rounding, so attributed amounts always sum to the price.
 */
export function attributeBundle(
  lines: readonly SaleLine[],
  bundlePriceMinor: number
): readonly BundleAttribution[] {
  const listTotal = lines.reduce((sum, line) => sum + Math.max(0, line.listAmountMinor), 0);
  if (listTotal <= 0) return lines.map((line) => ({ lineId: line.id, attributedMinor: 0 }));
  const price = Math.max(0, Math.round(bundlePriceMinor));
  const shares = lines.map((line) => {
    const exact = (Math.max(0, line.listAmountMinor) / listTotal) * price;
    const whole = Math.floor(exact);
    return { lineId: line.id, attributedMinor: whole, remainder: exact - whole };
  });
  const remainder = price - shares.reduce((sum, share) => sum + share.attributedMinor, 0);
  const order = shares
    .map((share, index) => ({ index, remainder: share.remainder }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let offset = 0; offset < remainder; offset += 1) {
    const target = order[offset % order.length];
    const share = target ? shares[target.index] : undefined;
    if (share) share.attributedMinor += 1;
  }
  return shares.map((share) => ({
    lineId: share.lineId,
    attributedMinor: share.attributedMinor,
  }));
}
