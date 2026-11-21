// No-Show Propensity Service (T-5009)
// Provides ML-like no-show risk scoring and dynamic deposit enforcement
// Pure functions - no Prisma/DB dependencies in the domain layer

/** No-show propensity features extracted from client profile and booking context */
export interface NoShowPropensityFeatures {
  /** Client lifetime visit count */
  lifetimeVisits: number;
  /** Client no-show count in rolling window (last 90 days) */
  noShowCount90Days: number;
  /** Client cancellation count in rolling window (last 90 days) */
  cancellationCount90Days: number;
  /** Booking lead time in hours */
  leadHours: number;
  /** Bookings in last 24h */
  bookingsLast24h: number;
  /** Visit frequency (visits per 30 days) */
  visitFrequency30d: number;
  /** Average spend per visit in UAH */
  avgSpendPerVisit: number;
  /** Device fingerprint entropy [0,1]; lower = more script-like */
  deviceFingerprintEntropy: number;
  /** Whether email domain is new (< 30 days old) */
  isNewEmailDomain: boolean;
  /** Whether IP/phone country mismatch */
  isCountryMismatch: boolean;
  /** Whether VPN/proxy detected */
  isVpnOrProxy: boolean;
  /** Whether datacenter IP */
  isDatacenterIp: boolean;
}

/** No-show propensity score from 0.0 (low risk) to 1.0 (high risk) */
export interface NoShowPropensityScore {
  /** Score from 0.0 to 1.0 */
  score: number;
  /** Risk tier: low, medium, high */
  tier: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Whether deposit hold is required */
  requiresDepositHold: boolean;
  /** Required deposit percentage (0-100) */
  depositPercent: number;
  /** Contributing factors */
  factors: string[];
  /** Model version */
  modelVersion: string;
  /** Timestamp of scoring */
  scoredAt: Date;
}

/** Default configuration for propensity thresholds */
export const DEFAULT_PROPENSITY_CONFIG = {
  lowThreshold: 0.33,
  mediumThreshold: 0.66,
  depositLow: 0,
  depositMedium: 50,
  depositHigh: 100,
};

/** No-show propensity service class. */
export class NoShowPropensityService {
  /** Calculate no-show propensity score based on client features.
   *  Returns a score from 0.0 to 1.0 and risk tier with deposit requirements.
   *  Rule-based scoring (placeholder for LightGBM model).
   */
  calculateNoShowPropensity(features: NoShowPropensityFeatures): NoShowPropensityScore {
    // Simple rule-based scoring (placeholder for LightGBM model)
    let points = 0;

    const { noShowCount90Days, lifetimeVisits, leadHours, deviceFingerprintEntropy } = features;

    // Rule: no-show history
    if (lifetimeVisits > 0) {
      const noShowRatio = noShowCount90Days / lifetimeVisits;
      points += Math.min(50, noShowRatio * 50);
    }

    // Rule: short lead time
    if (leadHours > 0 && leadHours < 24) {
      points += 20;
    }

    // Rule: low device entropy (script-like)
    if (deviceFingerprintEntropy > 0 && deviceFingerprintEntropy < 0.3) {
      points += 15;
    }

    const score = Math.min(100, points) / 100;
    const tier = score > 0.66 ? ('HIGH' as const) : score > 0.33 ? ('MEDIUM' as const) : ('LOW' as const);
    const depositPercent = tier === 'HIGH' ? 100 : tier === 'MEDIUM' ? 50 : 0;

    return {
      score,
      tier,
      requiresDepositHold: tier === 'HIGH',
      depositPercent,
      factors: [],
      modelVersion: 'v1.0-rules-based',
      scoredAt: new Date(),
    };
  }

  /** Feature builder: extract features from client profile and booking context */
  buildNoShowFeatures(
    lifetimeVisits: number,
    noShowCount90Days: number,
    cancellationCount90Days: number,
    leadHours: number,
    bookingsLast24h: number,
    avgSpendPerVisit: number,
    deviceFingerprintEntropy: number,
    isNewEmailDomain: boolean,
    isCountryMismatch: boolean,
    isVpnOrProxy: boolean,
    isDatacenterIp: boolean
  ): NoShowPropensityFeatures {
    return {
      lifetimeVisits,
      noShowCount90Days,
      cancellationCount90Days,
      leadHours,
      bookingsLast24h,
      visitFrequency30d: lifetimeVisits > 0 ? Math.min(30, (lifetimeVisits / 365) * 30) : 0,
      avgSpendPerVisit,
      deviceFingerprintEntropy,
      isNewEmailDomain,
      isCountryMismatch,
      isVpnOrProxy,
      isDatacenterIp,
    };
  }
}