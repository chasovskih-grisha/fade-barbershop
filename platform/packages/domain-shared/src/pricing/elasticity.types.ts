export interface PriceElasticitySimulationInput {
  basePriceCents: number;
  priceElasticityCoefficient?: number;
  baselineMonthlyVolume?: number;
  testMultipliers?: number[];
}

export interface ElasticitySimulationPoint {
  multiplier: number;
  priceCents: number;
  projectedVolume: number;
  projectedMonthlyRevenueCents: number;
  demandChangePercent: number;
  revenueChangePercent: number;
}

export interface PriceElasticitySimulationResult {
  basePriceCents: number;
  baselineMonthlyRevenueCents: number;
  optimalMultiplier: number;
  optimalPriceCents: number;
  maxMonthlyRevenueCents: number;
  simulationPoints: ElasticitySimulationPoint[];
  recommendationSummary: string;
}
