import type { CompetitorPricingMatrixRequest, CompetitorPricingMatrixResult } from './types';

function resolvePositioning(
  request: CompetitorPricingMatrixRequest,
  marketAveragePrice: number
): string {
  if (
    request.fadeAverageHaircutPrice > marketAveragePrice * 1.15 &&
    request.fadeAverageRating >= 4.5
  ) {
    return 'Premium Value Leader (High Price & High Rating)';
  }
  if (request.fadeAverageHaircutPrice < marketAveragePrice * 0.85) {
    return 'Value Challenger (Aggressive Pricing)';
  }
  return 'Competitive Mid-Market';
}

function resolveRecommendation(
  request: CompetitorPricingMatrixRequest,
  priceDeltaVsMarket: number
): string {
  if (priceDeltaVsMarket > 5 && request.fadeAverageRating < 4.4) {
    return 'Pricing is above market average while ratings trail competitors. Consider service quality enhancements before further price increases.';
  }
  if (priceDeltaVsMarket < -5 && request.fadeAverageRating >= 4.7) {
    return 'Strong rating leadership with below-market pricing. Opportunity to test premium tier pricing adjustments.';
  }
  return 'Pricing aligns well with local market average while maintaining strong ratings.';
}

/**
 * Analyze competitor pricing and rating matrix to determine market positioning and pricing power.
 */
export function analyzeCompetitorPricingMatrix(
  request: CompetitorPricingMatrixRequest
): CompetitorPricingMatrixResult {
  const competitors = request.competitors || [];
  if (competitors.length === 0) {
    return {
      marketAveragePrice: request.fadeAverageHaircutPrice,
      priceDeltaVsMarket: 0,
      positioningCategory: 'Solo Benchmark (Mid-Market)',
      recommendation: 'Add local competitor pricing benchmarks to evaluate market positioning.',
    };
  }

  const totalMarketPrice = competitors.reduce(
    (total, competitor) => total + competitor.averageHaircutPrice,
    request.fadeAverageHaircutPrice
  );
  const marketAveragePrice = Number((totalMarketPrice / (competitors.length + 1)).toFixed(2));
  const priceDeltaVsMarket = Number(
    (request.fadeAverageHaircutPrice - marketAveragePrice).toFixed(2)
  );

  return {
    marketAveragePrice,
    priceDeltaVsMarket,
    positioningCategory: resolvePositioning(request, marketAveragePrice),
    recommendation: resolveRecommendation(request, priceDeltaVsMarket),
  };
}
