import type { PricingOptimizationInput, PricingOptimizationResult } from './service.types';
import { recommendAddOns } from './add-ons';
import { generateServiceBundles } from './bundles';
import { calculateDynamicServicePrice } from './dynamic-price';

/**
 * Executes comprehensive revenue and pricing optimization for a transaction.
 */
export function optimizeRevenueAndPricing(
  input: PricingOptimizationInput
): PricingOptimizationResult {
  const {
    service,
    selectedTier,
    isPeakHour,
    isWeekend,
    activeAddOns = [],
    availableAddOns,
    clientLoyaltyScore = 50,
  } = input;

  const { adjustedPriceCents, tierMultiplier, peakMultiplier, weekendMultiplier } =
    calculateDynamicServicePrice({ service, tier: selectedTier, isPeakHour, isWeekend });

  const recommendedBundles = generateServiceBundles({
    primaryServiceId: service.serviceId,
    primaryServiceName: service.serviceName,
    primaryPriceCents: adjustedPriceCents,
    availableAddOns,
  });
  const recommendedAddOns = recommendAddOns(availableAddOns, activeAddOns, clientLoyaltyScore);

  const activeAddOnItems = availableAddOns.filter((addOn) => activeAddOns.includes(addOn.addOnId));
  const addOnsTotalCents = activeAddOnItems.reduce((sum, addOn) => sum + addOn.priceCents, 0);
  const subtotalCents = adjustedPriceCents + addOnsTotalCents;
  const totalDiscountCents = 0;

  return {
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    basePriceCents: service.basePriceCents,
    adjustedServicePriceCents: adjustedPriceCents,
    appliedMultipliers: {
      tier: selectedTier,
      tierMultiplier,
      peakMultiplier,
      weekendMultiplier,
    },
    recommendedBundles,
    recommendedAddOns,
    subtotalCents,
    totalDiscountCents,
    finalPriceCents: subtotalCents - totalDiscountCents,
    projectedRevenueLiftPercentage: projectRevenueLift(
      adjustedPriceCents / service.basePriceCents,
      recommendedAddOns.length
    ),
  };
}

function projectRevenueLift(baseVsAdjustedRatio: number, recommendationCount: number): number {
  const addOnLift = recommendationCount > 0 ? 0.12 : 0.05;
  const lift = Number(((baseVsAdjustedRatio - 1 + addOnLift) * 100).toFixed(1));
  return Math.max(5.0, lift);
}
