export interface PacingInput {
  basePrice: number;
  historicalFillRate: number; // 0.0 to 1.0
  weatherCondition?: 'clear' | 'rain' | 'snow' | 'extreme';
  localEventFactor?: number; // e.g. -0.2 to 0.5
  isSlowHour: boolean;
}

export interface PacingResult {
  finalPrice: number;
  pacingMultiplier: number;
  surgeApplied: boolean;
  slowHourDiscountApplied: boolean;
  estimatedConversionElasticity: number;
}

export class DynamicSurgePacingOptimizer {
  public static calculatePacedPricing(input: PacingInput): PacingResult {
    const {
      basePrice,
      historicalFillRate,
      weatherCondition = 'clear',
      localEventFactor = 0,
      isSlowHour,
    } = input;

    let multiplier = 1.0;

    // Slow hour incentive discount
    if (isSlowHour && historicalFillRate < 0.4) {
      multiplier -= 0.15; // 15% discount for empty slots
    }

    // High historical fill rate surge
    if (historicalFillRate > 0.8) {
      multiplier += 0.3;
    } else if (historicalFillRate > 0.6) {
      multiplier += 0.15;
    }

    // Weather impact
    if (weatherCondition === 'rain' || weatherCondition === 'snow') {
      multiplier -= 0.05; // slight dampening during bad weather
    } else if (weatherCondition === 'extreme') {
      multiplier -= 0.1;
    }

    // Local event factor
    multiplier += Math.max(-0.2, Math.min(0.5, localEventFactor));

    // Ensure price doesn't drop below 50% of base or exceed 250%
    multiplier = Math.max(0.5, Math.min(2.5, multiplier));
    multiplier = Math.round(multiplier * 100) / 100;

    const finalPrice = Math.round(basePrice * multiplier * 100) / 100;
    const slowHourDiscountApplied = isSlowHour && multiplier < 1.0;
    const surgeApplied = multiplier > 1.0;

    // Conversion elasticity estimation (approximate price sensitivity coefficient)
    const elasticity = Math.round((1.0 - (multiplier - 1.0) * 0.4) * 100) / 100;

    return {
      finalPrice,
      pacingMultiplier: multiplier,
      surgeApplied,
      slowHourDiscountApplied,
      estimatedConversionElasticity: Math.max(0.1, elasticity),
    };
  }
}
