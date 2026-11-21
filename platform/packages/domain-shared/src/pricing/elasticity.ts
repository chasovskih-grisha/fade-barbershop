import type {
  ElasticitySimulationPoint,
  PriceElasticitySimulationInput,
  PriceElasticitySimulationResult,
} from './elasticity.types';

const DEFAULT_MULTIPLIERS = [1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5];

interface SimulationContext {
  basePriceCents: number;
  elasticity: number;
  baselineVolume: number;
  baselineRevenue: number;
}

function simulatePoint(multiplier: number, context: SimulationContext): ElasticitySimulationPoint {
  const { basePriceCents, elasticity, baselineVolume, baselineRevenue } = context;
  const priceCents = Math.round(basePriceCents * multiplier);
  const priceChangePercent = (multiplier - 1.0) * 100;
  const demandChangePercent = elasticity * priceChangePercent;
  const projectedVolume = Math.max(5, Math.round(baselineVolume * (1 + demandChangePercent / 100)));
  const projectedMonthlyRevenueCents = priceCents * projectedVolume;

  return {
    multiplier: Number(multiplier.toFixed(2)),
    priceCents,
    projectedVolume,
    projectedMonthlyRevenueCents,
    demandChangePercent: Number(demandChangePercent.toFixed(1)),
    revenueChangePercent: Number(
      (((projectedMonthlyRevenueCents - baselineRevenue) / baselineRevenue) * 100).toFixed(1)
    ),
  };
}

/**
 * Forecasts monthly revenue across price multipliers to find the optimal price point.
 */
export function simulatePriceElasticityAndForecastRevenue(
  input: PriceElasticitySimulationInput
): PriceElasticitySimulationResult {
  const basePriceCents = Math.max(100, input.basePriceCents);
  const elasticity = input.priceElasticityCoefficient ?? -1.3;
  const baselineVolume = Math.max(10, input.baselineMonthlyVolume ?? 350);
  const multipliers = input.testMultipliers ?? DEFAULT_MULTIPLIERS;
  const baselineMonthlyRevenueCents = basePriceCents * baselineVolume;

  let optimalMultiplier = 1.0;
  let maxMonthlyRevenueCents = baselineMonthlyRevenueCents;
  const simulationPoints: ElasticitySimulationPoint[] = [];

  for (const multiplier of multipliers) {
    const point = simulatePoint(multiplier, {
      basePriceCents,
      elasticity,
      baselineVolume,
      baselineRevenue: baselineMonthlyRevenueCents,
    });
    simulationPoints.push(point);
    if (point.projectedMonthlyRevenueCents > maxMonthlyRevenueCents) {
      maxMonthlyRevenueCents = point.projectedMonthlyRevenueCents;
      optimalMultiplier = multiplier;
    }
  }

  const optimalPriceCents = Math.round(basePriceCents * optimalMultiplier);
  const maxRevenueLiftPercent = Number(
    (
      ((maxMonthlyRevenueCents - baselineMonthlyRevenueCents) / baselineMonthlyRevenueCents) *
      100
    ).toFixed(1)
  );

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
