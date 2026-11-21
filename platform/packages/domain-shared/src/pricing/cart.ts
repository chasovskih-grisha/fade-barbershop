import type { CartOptimizationInput, CartOptimizationResult } from './cart.types';
import { recommendAddOns } from './add-ons';

interface TieredDiscount {
  discountPercentage: number;
  discountAmountCents: number;
  finalAddOnTotalCents: number;
}

/**
 * Calculates progressive tiered discounts to incentivize larger add-on carts.
 */
export function calculateTieredCartAddOnDiscount(
  addOnCount: number,
  baseAddOnTotalCents: number
): TieredDiscount {
  let discountPercentage = 0;
  if (addOnCount >= 3) discountPercentage = 20;
  else if (addOnCount === 2) discountPercentage = 10;

  const discountAmountCents = Math.round((baseAddOnTotalCents * discountPercentage) / 100);
  return {
    discountPercentage,
    discountAmountCents,
    finalAddOnTotalCents: baseAddOnTotalCents - discountAmountCents,
  };
}

/**
 * Optimizes cart revenue and recommends the next best add-on.
 */
export function optimizeCartRevenue(input: CartOptimizationInput): CartOptimizationResult {
  const {
    baseServicePriceCents,
    selectedAddOnIds,
    availableAddOns,
    clientLoyaltyScore = 50,
  } = input;

  const selectedAddOns = availableAddOns.filter((addOn) =>
    selectedAddOnIds.includes(addOn.addOnId)
  );
  const rawAddOnsTotalCents = selectedAddOns.reduce((sum, addOn) => sum + addOn.priceCents, 0);
  const { discountPercentage, discountAmountCents, finalAddOnTotalCents } =
    calculateTieredCartAddOnDiscount(selectedAddOns.length, rawAddOnsTotalCents);

  const recommendations = recommendAddOns(availableAddOns, selectedAddOnIds, clientLoyaltyScore);
  const nextAddOn = recommendations[0];

  return {
    baseServicePriceCents,
    selectedAddOns,
    rawAddOnsTotalCents,
    tieredDiscountPercentage: discountPercentage,
    discountAmountCents,
    finalAddOnTotalCents,
    finalCartTotalCents: baseServicePriceCents + finalAddOnTotalCents,
    ...(nextAddOn ? { recommendedNextAddOn: nextAddOn } : {}),
  };
}
