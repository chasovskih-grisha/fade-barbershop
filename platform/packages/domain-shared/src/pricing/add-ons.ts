import type { AddOnItem, AddOnRecommendation } from './service.types';

/**
 * Recommends high-attach-rate add-ons ranked by client context.
 */
export function recommendAddOns(
  availableAddOns: AddOnItem[],
  activeAddOns: string[] = [],
  clientLoyaltyScore: number = 50
): AddOnRecommendation[] {
  const unselected = availableAddOns.filter((addOn) => !activeAddOns.includes(addOn.addOnId));

  return unselected
    .map((addOn) => buildRecommendation(addOn, clientLoyaltyScore))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function buildRecommendation(addOn: AddOnItem, loyaltyScore: number): AddOnRecommendation {
  let relevanceScore = addOn.historicalAttachRate * 100;
  if (loyaltyScore > 75 && addOn.category === 'grooming') {
    relevanceScore += 15;
  }
  relevanceScore = Math.min(100, Math.max(0, Math.round(relevanceScore)));

  const estimatedAttachRate = Math.min(
    0.85,
    addOn.historicalAttachRate * (loyaltyScore > 70 ? 1.3 : 1.1)
  );

  return {
    addOnId: addOn.addOnId,
    name: addOn.name,
    priceCents: addOn.priceCents,
    relevanceScore,
    estimatedAttachRate: Number(estimatedAttachRate.toFixed(2)),
  };
}
