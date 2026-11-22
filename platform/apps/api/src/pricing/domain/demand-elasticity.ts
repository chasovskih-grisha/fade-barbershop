/**
 * Demand-elasticity surge recommendations (T-5005).
 * Complements `surge-rule.ts` (static day/time/tier rules): this layer reacts to
 * observed velocity, capacity, weather and local events, with hard safety bounds.
 */

import {
  DEFAULT_ELASTICITY_BOUNDS,
  type DemandSignals,
  type ElasticityBounds,
  type RevenueImpact,
  type RevenueImpactInput,
  type SurgeRecommendation,
  type VelocityPoint,
} from './demand.types';

export type {
  DemandSignals,
  ElasticityBounds,
  RevenueImpact,
  RevenueImpactInput,
  SurgeRecommendation,
  VelocityPoint,
} from './demand.types';

export { DEFAULT_ELASTICITY_BOUNDS } from './demand.types';

/** Below half capacity surge is never applied: empty chairs are not scarce. */
const MIN_UTILISATION_FOR_SURGE = 0.5;
const BASE_BP = 10_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function utilisationOf(velocity: number, capacityPerHour: number): number {
  if (capacityPerHour <= 0) return 1;
  return clamp(velocity / capacityPerHour, 0, 1.2);
}

/** Velocity relative to baseline, multiplied by weather and local-event factors. */
export function demandIndex(signals: DemandSignals): number {
  const baseline = signals.baselineVelocity > 0
    ? signals.baselineVelocity
    : signals.bookingVelocity;
  const relative = baseline > 0 ? signals.bookingVelocity / baseline : 1;
  return relative * Math.max(0, signals.weatherDemandFactor) * Math.max(0, signals.localEventFactor);
}

/**
 * Arc elasticity averaged over consecutive observed points.
 * Negative by construction (demand falls as price rises); clamped to [-5, 0].
 */
export function estimateElasticity(history: readonly VelocityPoint[]): number {
  const points = history.filter((point) => point.multiplierBp > 0 && point.velocity > 0);
  const estimates: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current || previous.multiplierBp === current.multiplierBp) continue;
    const priceChange = (current.multiplierBp - previous.multiplierBp) /
      ((current.multiplierBp + previous.multiplierBp) / 2);
    const demandChange = (current.velocity - previous.velocity) /
      ((current.velocity + previous.velocity) / 2);
    if (priceChange !== 0) estimates.push(demandChange / priceChange);
  }
  if (estimates.length === 0) return -1;
  const mean = estimates.reduce((sum, value) => sum + value, 0) / estimates.length;
  return clamp(mean, -5, 0);
}

function baseRecommendation(
  utilisation: number,
  index: number,
  bounds: ElasticityBounds
): SurgeRecommendation {
  return {
    multiplierBp: bounds.minMultiplierBp,
    utilisation,
    demandIndex: index,
    clamped: false,
    reason: 'off-peak: base price',
  };
}

/** Half of excess demand is passed into price, then clamped to the safety bounds. */
export function recommendMultiplier(
  signals: DemandSignals,
  bounds: ElasticityBounds = DEFAULT_ELASTICITY_BOUNDS
): SurgeRecommendation {
  const utilisation = utilisationOf(signals.bookingVelocity, signals.capacityPerHour);
  const index = demandIndex(signals);
  if (utilisation < MIN_UTILISATION_FOR_SURGE || index <= 1) {
    return baseRecommendation(utilisation, index, bounds);
  }
  const raw = Math.round(BASE_BP * (1 + (index - 1) * 0.5));
  const multiplierBp = clamp(raw, bounds.minMultiplierBp, bounds.maxMultiplierBp);
  return {
    multiplierBp,
    utilisation,
    demandIndex: index,
    clamped: multiplierBp !== raw,
    reason: multiplierBp > BASE_BP ? 'demand exceeds baseline' : 'off-peak: base price',
  };
}

/** Revenue projection: q' = q × multiplier^elasticity, revenue = q' × p × multiplier. */
export function projectRevenueImpact(input: RevenueImpactInput): RevenueImpact {
  const baseRevenueMinor = Math.round(input.velocity * input.averagePriceMinor);
  const multiplier = input.multiplierBp / BASE_BP;
  const demandFactor = Math.pow(multiplier, input.elasticity);
  const projectedRevenueMinor = Math.round(
    input.velocity * demandFactor * input.averagePriceMinor * multiplier
  );
  return {
    baseRevenueMinor,
    projectedRevenueMinor,
    deltaMinor: projectedRevenueMinor - baseRevenueMinor,
  };
}
