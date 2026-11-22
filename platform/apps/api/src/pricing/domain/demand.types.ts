/** Demand-elasticity surge pricing vocabulary (T-5005). */

export interface DemandSignals {
  readonly locationId: string;
  readonly windowStart: Date;
  /** Bookings per hour inside the pricing window. */
  readonly bookingVelocity: number;
  /** Historical bookings per hour for the same weekday/time. */
  readonly baselineVelocity: number;
  /** Chairs multiplied by services per chair-hour. */
  readonly capacityPerHour: number;
  /** 1.0 neutral; >1 demand boost, <1 demand drop (weather). */
  readonly weatherDemandFactor: number;
  /** 1.0 no event; >1 nearby concert or game. */
  readonly localEventFactor: number;
}

export interface ElasticityBounds {
  readonly minMultiplierBp: number;
  readonly maxMultiplierBp: number;
}

/** Never discount below base price; never exceed ×1.5 without a manual override. */
export const DEFAULT_ELASTICITY_BOUNDS: ElasticityBounds = {
  minMultiplierBp: 10_000,
  maxMultiplierBp: 15_000,
};

/** Observed price/velocity pair used to estimate demand elasticity. */
export interface VelocityPoint {
  readonly multiplierBp: number;
  readonly velocity: number;
}

export interface SurgeRecommendation {
  readonly multiplierBp: number;
  readonly utilisation: number;
  readonly demandIndex: number;
  readonly clamped: boolean;
  readonly reason: string;
}

export interface RevenueImpactInput {
  readonly velocity: number;
  readonly averagePriceMinor: number;
  readonly multiplierBp: number;
  /** Estimated elasticity, e.g. -1.2: a 1% price rise costs 1.2% demand. */
  readonly elasticity: number;
}

export interface RevenueImpact {
  readonly baseRevenueMinor: number;
  readonly projectedRevenueMinor: number;
  readonly deltaMinor: number;
}
