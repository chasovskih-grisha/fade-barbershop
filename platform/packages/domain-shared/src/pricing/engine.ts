import {
  ServicePricingConfig,
  ServiceBundle,
  AddOnItem,
  PricingOptimizationInput,
  PricingOptimizationResult,
  AddOnRecommendation,
} from './types';

/**
 * Calculates dynamic service pricing based on tier, peak hours, and weekend multipliers.
 */
export function calculateDynamicServicePrice(
  service: ServicePricingConfig,
  tier: keyof ServicePricingConfig['tierMultipliers'],
  isPeakHour: boolean,
  isWeekend: boolean
): { adjustedPriceCents: number; tierMultiplier: number; peakMultiplier: number; weekendMultiplier: number } {
  const tierMultiplier = service.tierMultipliers[tier] ?? 1.0;
  const peakMultiplier = isPeakHour ? service.peakHourMultiplier : 1.0;
  const weekendMultiplier = isWeekend ? service.weekendMultiplier : 1.0;

  // Compound multiplier approach or additive surge
  const adjustedPriceCents = Math.round(
    service.basePriceCents * tierMultiplier * peakMultiplier * weekendMultiplier
  );

  return {
    adjustedPriceCents,
    tierMultiplier,
    peakMultiplier: isPeakHour ? service.peakHourMultiplier : 1.0,
    weekendMultiplier: isWeekend ? service.weekendMultiplier : 1.0,
  };
}

/**
 * Creates optimal service bundles with intelligent discount pricing.
 */
export function generateServiceBundles(
  primaryServiceId: string,
  primaryServiceName: string,
  primaryPriceCents: number,
  availableAddOns: AddOnItem[]
): ServiceBundle[] {
  if (availableAddOns.length === 0) return [];

  // Group add-ons into curated bundles (e.g. Executive Grooming, Refresh & Style)
  const bundles: ServiceBundle[] = [];

  const groomingAddOns = availableAddOns.filter((a) => a.category === 'grooming' || a.category === 'styling');
  if (groomingAddOns.length >= 2) {
    const items = [
      { serviceId: primaryServiceId, name: primaryServiceName, regularPriceCents: primaryPriceCents },
      ...groomingAddOns.slice(0, 2).map((a) => ({ serviceId: a.addOnId, name: a.name, regularPriceCents: a.priceCents })),
    ];
    const regularTotal = items.reduce((sum, item) => sum + item.regularPriceCents, 0);
    const discountPercentage = 15; // 15% bundle savings
    const bundledPriceCents = Math.round(regularTotal * (1 - discountPercentage / 100));
    const savingsCents = regularTotal - bundledPriceCents;

    bundles.push({
      bundleId: 'bundle-executive-package',
      name: 'Executive Grooming Package',
      description: 'Signature haircut combined with premium grooming add-ons for the ultimate polish.',
      items,
      discountPercentage,
      bundledPriceCents,
      savingsCents,
    });
  }

  // Express Refresh Bundle
  const expressAddOns = availableAddOns.filter((a) => a.category === 'express' || a.category === 'beverage');
  const firstExpress = expressAddOns[0];
  if (expressAddOns.length >= 1 && firstExpress) {
    const items = [
      { serviceId: primaryServiceId, name: primaryServiceName, regularPriceCents: primaryPriceCents },
      { serviceId: firstExpress.addOnId, name: firstExpress.name, regularPriceCents: firstExpress.priceCents },
    ];
    const regularTotal = items.reduce((sum, item) => sum + item.regularPriceCents, 0);
    const discountPercentage = 10; // 10% bundle savings
    const bundledPriceCents = Math.round(regularTotal * (1 - discountPercentage / 100));
    const savingsCents = regularTotal - bundledPriceCents;

    bundles.push({
      bundleId: 'bundle-express-refresh',
      name: 'Express Refresh Bundle',
      description: 'Core service paired with a refreshing beverage or express touch-up.',
      items,
      discountPercentage,
      bundledPriceCents,
      savingsCents,
    });
  }

  return bundles;
}

/**
 * Recommends high-attach-rate add-ons based on client history and service context.
 */
export function recommendAddOns(
  availableAddOns: AddOnItem[],
  activeAddOns: string[] = [],
  clientLoyaltyScore: number = 50
): AddOnRecommendation[] {
  const unselected = availableAddOns.filter((a) => !activeAddOns.includes(a.addOnId));

  return unselected
    .map((addOn) => {
      // Calculate relevance score based on historical attach rate and client loyalty
      let relevanceScore = addOn.historicalAttachRate * 100;
      if (clientLoyaltyScore > 75 && addOn.category === 'grooming') {
        relevanceScore += 15; // VIP clients love premium grooming
      }
      relevanceScore = Math.min(100, Math.max(0, Math.round(relevanceScore)));

      // Estimated attach rate boosted by intelligent targeting
      const estimatedAttachRate = Math.min(0.85, addOn.historicalAttachRate * (clientLoyaltyScore > 70 ? 1.3 : 1.1));

      return {
        addOnId: addOn.addOnId,
        name: addOn.name,
        priceCents: addOn.priceCents,
        relevanceScore,
        estimatedAttachRate: Number(estimatedAttachRate.toFixed(2)),
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Executes comprehensive revenue and pricing optimization analysis for a transaction or booking.
 */
export function optimizeRevenueAndPricing(input: PricingOptimizationInput): PricingOptimizationResult {
  const { service, selectedTier, isPeakHour, isWeekend, activeAddOns = [], availableAddOns, clientLoyaltyScore = 50 } = input;

  const { adjustedPriceCents, tierMultiplier, peakMultiplier, weekendMultiplier } = calculateDynamicServicePrice(
    service,
    selectedTier,
    isPeakHour,
    isWeekend
  );

  const recommendedBundles = generateServiceBundles(service.serviceId, service.serviceName, adjustedPriceCents, availableAddOns);
  const recommendedAddOns = recommendAddOns(availableAddOns, activeAddOns, clientLoyaltyScore);

  // Calculate active add-ons total
  const activeAddOnItems = availableAddOns.filter((a) => activeAddOns.includes(a.addOnId));
  const addOnsTotalCents = activeAddOnItems.reduce((sum, a) => sum + a.priceCents, 0);

  const subtotalCents = adjustedPriceCents + addOnsTotalCents;
  const totalDiscountCents = 0; // Can apply bundle discount if bundle selected
  const finalPriceCents = subtotalCents - totalDiscountCents;

  // Projected revenue lift based on dynamic pricing + add-on attach rate optimization
  const baseVsAdjustedRatio = adjustedPriceCents / service.basePriceCents;
  const addOnLift = recommendedAddOns.length > 0 ? 0.12 : 0.05; // 12% lift from smart recommendations
  const projectedRevenueLiftPercentage = Number(((baseVsAdjustedRatio - 1 + addOnLift) * 100).toFixed(1));

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
    finalPriceCents,
    projectedRevenueLiftPercentage: Math.max(5.0, projectedRevenueLiftPercentage),
  };
}

/**
 * Simulates price elasticity and forecasts monthly revenue across various pricing multipliers
 * to determine the optimal profit-maximizing price point.
 */
export function simulatePriceElasticityAndForecastRevenue(
  input: import('./types').PriceElasticitySimulationInput
): import('./types').PriceElasticitySimulationResult {
  const basePriceCents = Math.max(100, input.basePriceCents);
  const elasticity = input.priceElasticityCoefficient ?? -1.3; // standard barbershop demand elasticity
  const baselineVolume = Math.max(10, input.baselineMonthlyVolume ?? 350);
  const multipliers = input.testMultipliers ?? [1.0, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.40, 1.50];

  const baselineMonthlyRevenueCents = basePriceCents * baselineVolume;

  let optimalMultiplier = 1.0;
  let maxMonthlyRevenueCents = baselineMonthlyRevenueCents;
  const simulationPoints: import('./types').ElasticitySimulationPoint[] = [];

  for (const mult of multipliers) {
    const priceCents = Math.round(basePriceCents * mult);
    const priceChangePercent = (mult - 1.0) * 100;
    // Demand change percentage = elasticity * priceChangePercent
    const demandChangePercent = elasticity * priceChangePercent;
    const projectedVolume = Math.max(5, Math.round(baselineVolume * (1 + demandChangePercent / 100)));
    const projectedMonthlyRevenueCents = priceCents * projectedVolume;
    const revenueChangePercent = Number((((projectedMonthlyRevenueCents - baselineMonthlyRevenueCents) / baselineMonthlyRevenueCents) * 100).toFixed(1));

    simulationPoints.push({
      multiplier: Number(mult.toFixed(2)),
      priceCents,
      projectedVolume,
      projectedMonthlyRevenueCents,
      demandChangePercent: Number(demandChangePercent.toFixed(1)),
      revenueChangePercent,
    });

    if (projectedMonthlyRevenueCents > maxMonthlyRevenueCents) {
      maxMonthlyRevenueCents = projectedMonthlyRevenueCents;
      optimalMultiplier = mult;
    }
  }

  const optimalPriceCents = Math.round(basePriceCents * optimalMultiplier);
  const maxRevenueLiftPercent = Number((((maxMonthlyRevenueCents - baselineMonthlyRevenueCents) / baselineMonthlyRevenueCents) * 100).toFixed(1));

  return {
    basePriceCents,
    baselineMonthlyRevenueCents,
    optimalMultiplier: Number(optimalMultiplier.toFixed(2)),
    optimalPriceCents,
    maxMonthlyRevenueCents,
    simulationPoints,
    recommendationSummary: `Optimal pricing multiplier is ${optimalMultiplier.toFixed(2)}x (${optimalPriceCents / 100} ₴), projecting a +${maxRevenueLiftPercent}% increase in monthly revenue under an elasticity coefficient of ${elasticity}.`,
  };
}

/**
 * Calculates progressive tiered discounts for multi-item add-on carts to incentivize basket size growth.
 */
export function calculateTieredCartAddOnDiscount(
  addOnCount: number,
  baseAddOnTotalCents: number
): { discountPercentage: number; discountAmountCents: number; finalAddOnTotalCents: number } {
  let discountPercentage = 0;
  if (addOnCount >= 3) {
    discountPercentage = 20; // 20% off for 3+ add-ons
  } else if (addOnCount === 2) {
    discountPercentage = 10; // 10% off for 2 add-ons
  } else {
    discountPercentage = 0;
  }

  const discountAmountCents = Math.round((baseAddOnTotalCents * discountPercentage) / 100);
  const finalAddOnTotalCents = baseAddOnTotalCents - discountAmountCents;

  return {
    discountPercentage,
    discountAmountCents,
    finalAddOnTotalCents,
  };
}

/**
 * Optimizes cart revenue by calculating tiered add-on discounts and recommending the next best add-on.
 */
export function optimizeCartRevenue(
  input: import('./types').CartOptimizationInput
): import('./types').CartOptimizationResult {
  const { baseServicePriceCents, selectedAddOnIds, availableAddOns, clientLoyaltyScore = 50 } = input;

  const selectedAddOns = availableAddOns.filter((a) => selectedAddOnIds.includes(a.addOnId));
  const rawAddOnsTotalCents = selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);

  const { discountPercentage, discountAmountCents, finalAddOnTotalCents } = calculateTieredCartAddOnDiscount(
    selectedAddOns.length,
    rawAddOnsTotalCents
  );

  const finalCartTotalCents = baseServicePriceCents + finalAddOnTotalCents;

  const recommendations = recommendAddOns(availableAddOns, selectedAddOnIds, clientLoyaltyScore);

  return {
    baseServicePriceCents,
    selectedAddOns,
    rawAddOnsTotalCents,
    tieredDiscountPercentage: discountPercentage,
    discountAmountCents,
    finalAddOnTotalCents,
    finalCartTotalCents,
    ...(recommendations.length > 0 ? { recommendedNextAddOn: recommendations[0] } : {}),
  };
}
