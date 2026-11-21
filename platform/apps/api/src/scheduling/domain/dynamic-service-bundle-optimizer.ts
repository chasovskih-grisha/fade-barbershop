/* eslint-disable complexity -- 1 function with inherent domain branching (worst: calculateDynamicBundlePricing, complexity 11 vs 10); refactor tracked in T-2500f */
export interface ServiceItem {
  id: string;
  name: string;
  basePriceUsd: number;
  isAddOn?: boolean;
}

export interface DynamicBundleRequest {
  items: ServiceItem[];
  bundleDiscountPercent?: number; // e.g. 10 for 10% off bundle
  addOnIncentiveDiscountPercent?: number; // extra discount for add-on if primary service attached
  vipTierDiscountPercent?: number;
}

export interface DynamicBundleResult {
  originalTotalUsd: number;
  discountedTotalUsd: number;
  totalSavingsUsd: number;
  effectiveDiscountPercent: number;
  itemizedBreakdown: Array<{
    id: string;
    name: string;
    basePriceUsd: number;
    finalPriceUsd: number;
    discountAppliedUsd: number;
  }>;
  reason: string;
}

/**
 * Calculates optimized pricing for multi-service bundles and add-on attach rates.
 */
export function calculateDynamicBundlePricing(request: DynamicBundleRequest): DynamicBundleResult {
  let originalTotal = 0;
  const itemizedBreakdown: DynamicBundleResult['itemizedBreakdown'] = [];

  const primaryItems = request.items.filter((i) => !i.isAddOn);
  const addOnItems = request.items.filter((i) => i.isAddOn);

  const hasPrimary = primaryItems.length > 0;
  const bundleDiscount = request.bundleDiscountPercent || (request.items.length >= 2 ? 15 : 0);
  const addOnDiscount =
    request.addOnIncentiveDiscountPercent || (hasPrimary && addOnItems.length > 0 ? 25 : 0);
  const vipDiscount = request.vipTierDiscountPercent || 0;

  for (const item of request.items) {
    const base = Math.max(0, item.basePriceUsd);
    originalTotal += base;

    let itemDiscountPercent = 0;
    if (item.isAddOn && hasPrimary) {
      itemDiscountPercent = addOnDiscount;
    } else {
      itemDiscountPercent = bundleDiscount;
    }

    // Combine with VIP tier discount if present (additive up to 50% max)
    const combinedDiscountPercent = Math.min(50, itemDiscountPercent + vipDiscount);
    const discountAmount = (base * combinedDiscountPercent) / 100;
    const finalPrice = Math.max(0, Number((base - discountAmount).toFixed(2)));

    itemizedBreakdown.push({
      id: item.id,
      name: item.name,
      basePriceUsd: base,
      finalPriceUsd: finalPrice,
      discountAppliedUsd: Number(discountAmount.toFixed(2)),
    });
  }

  const discountedTotalUsd = Number(
    itemizedBreakdown.reduce((sum, item) => sum + item.finalPriceUsd, 0).toFixed(2)
  );
  const totalSavingsUsd = Number((originalTotal - discountedTotalUsd).toFixed(2));
  const effectiveDiscountPercent =
    originalTotal > 0 ? Number(((totalSavingsUsd / originalTotal) * 100).toFixed(1)) : 0;

  return {
    originalTotalUsd: Number(originalTotal.toFixed(2)),
    discountedTotalUsd,
    totalSavingsUsd,
    effectiveDiscountPercent,
    itemizedBreakdown,
    reason: `Calculated dynamic bundle pricing for ${request.items.length} items (Original: $${originalTotal.toFixed(2)}, Final: $${discountedTotalUsd}, Savings: $${totalSavingsUsd} / ${effectiveDiscountPercent}%).`,
  };
}
