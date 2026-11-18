export interface PeakPricingConfig {
  weekendPeakMultiplier: number; // e.g. 1.25 (+25%)
  eveningPeakMultiplier: number; // e.g. 1.20 (+20%)
  highOccupancySurgeMultiplier: number; // e.g. 1.40 (+40%) when occupancy >= 85%
  occupancyThresholdForSurge: number; // e.g. 0.85
}

export const DEFAULT_PEAK_PRICING_CONFIG: PeakPricingConfig = {
  weekendPeakMultiplier: 1.25,
  eveningPeakMultiplier: 1.20,
  highOccupancySurgeMultiplier: 1.40,
  occupancyThresholdForSurge: 0.85,
};

export interface PeakPricingInput {
  slotStart: Date; // UTC date time of appointment
  chairOccupancyRate?: number; // 0.0 to 1.0 representing location/barber chair utilization
}

export interface PeakPricingResult {
  multiplier: number;
  isPeak: boolean;
  surgeReason: 'STANDARD' | 'WEEKEND_PEAK' | 'EVENING_PEAK' | 'HIGH_OCCUPANCY_SURGE';
  surgedPrice: (basePrice: number) => number;
}

export class PeakHourPricingService {
  constructor(private config: PeakPricingConfig = DEFAULT_PEAK_PRICING_CONFIG) {}

  /**
   * Evaluates whether a requested slot falls into peak demand hours and computes surge multiplier.
   */
  evaluateSlotPricing(input: PeakPricingInput): PeakPricingResult {
    const date = input.slotStart;
    const dayOfWeek = date.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const hour = date.getUTCHours(); // UTC hour (approximate location hour or normalized)
    const occupancy = input.chairOccupancyRate ?? 0.5;

    let multiplier = 1.0;
    let isPeak = false;
    let surgeReason: 'STANDARD' | 'WEEKEND_PEAK' | 'EVENING_PEAK' | 'HIGH_OCCUPANCY_SURGE' = 'STANDARD';

    // High occupancy surge takes highest priority
    if (occupancy >= this.config.occupancyThresholdForSurge) {
      multiplier = this.config.highOccupancySurgeMultiplier;
      isPeak = true;
      surgeReason = 'HIGH_OCCUPANCY_SURGE';
    } else if (dayOfWeek === 6 || dayOfWeek === 0) {
      // Weekend (Saturday, Sunday) peak hours: 11:00 - 17:00 UTC
      if (hour >= 11 && hour <= 17) {
        multiplier = this.config.weekendPeakMultiplier;
        isPeak = true;
        surgeReason = 'WEEKEND_PEAK';
      }
    } else if (dayOfWeek === 5) {
      // Friday evening peak hours: 16:00 - 20:00 UTC
      if (hour >= 16 && hour <= 20) {
        multiplier = this.config.eveningPeakMultiplier;
        isPeak = true;
        surgeReason = 'EVENING_PEAK';
      }
    }

    return {
      multiplier,
      isPeak,
      surgeReason,
      surgedPrice: (basePrice: number) => Math.round(basePrice * multiplier),
    };
  }
}
