export interface CompetitorPricingInput {
  competitorName: string;
  averageHaircutPrice: number;
  rating: number;
  positioning: 'luxury' | 'mid-market' | 'budget';
}

export interface CompetitorPricingMatrixRequest {
  fadeAverageHaircutPrice: number;
  fadeAverageRating: number;
  competitors: CompetitorPricingInput[];
}

export interface CompetitorPricingMatrixResult {
  marketAveragePrice: number;
  priceDeltaVsMarket: number;
  positioningCategory: string;
  recommendation: string;
}
