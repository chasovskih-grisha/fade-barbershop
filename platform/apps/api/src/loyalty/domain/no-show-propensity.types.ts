// No-Show Propensity domain types (T-5009).
// Shared by the scoring model, the injectable service and the HTTP DTO layer.

export type NoShowRiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

/** Raw client and booking data used to score no-show risk. */
export interface NoShowFeatureInput {
  lifetimeVisits: number;
  noShowCount90Days: number;
  cancellationCount90Days: number;
  leadHours: number;
  bookingsLast24h: number;
  avgSpendPerVisit: number;
  deviceFingerprintEntropy: number;
  isNewEmailDomain: boolean;
  isCountryMismatch: boolean;
  isVpnOrProxy: boolean;
  isDatacenterIp: boolean;
}

/** Features with derived values, ready for scoring. */
export interface NoShowPropensityFeatures extends NoShowFeatureInput {
  visitFrequency30d: number;
}

/** No-show propensity score from 0.0 (low risk) to 1.0 (high risk). */
export interface NoShowPropensityScore {
  score: number;
  tier: NoShowRiskTier;
  requiresDepositHold: boolean;
  depositPercent: number;
  factors: string[];
  modelVersion: string;
  scoredAt: Date;
}

/** A single scoring rule that contributed to the final score. */
export interface NoShowRiskRule {
  label: string;
  points: number;
  matched: boolean;
}
