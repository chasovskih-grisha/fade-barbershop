export interface SlotSurgeConfig {
  basePrice: number;
  demandFactor: number; // 0.0 to 2.0
  isPeakHour: boolean;
  vipPriorityMultiplier: number;
}

export interface SurgePricingResult {
  finalPrice: number;
  surgeMultiplier: number;
  surgeApplied: boolean;
}

export class PeakSurgePricingOptimizer {
  public static calculateSurgePrice(config: SlotSurgeConfig): SurgePricingResult {
    const { basePrice, demandFactor, isPeakHour, vipPriorityMultiplier } = config;

    let multiplier = 1.0;
    if (isPeakHour) {
      multiplier += 0.25;
    }

    // Add demand factor influence
    multiplier += Math.max(0, demandFactor * 0.5);

    // VIP discount or multiplier adjustment if applicable
    if (vipPriorityMultiplier > 1.0) {
      // VIPs get preferential surge caps or multipliers
      multiplier = Math.min(multiplier, 1.35);
    }

    const finalPrice = Math.round(basePrice * multiplier * 100) / 100;
    return {
      finalPrice,
      surgeMultiplier: Math.round(multiplier * 100) / 100,
      surgeApplied: multiplier > 1.0,
    };
  }
}
