// No-Show Propensity Scoring (T-5009)
// LightGBM-like binary classification model scoring each appointment 0.0 to 1.0
// Rules-based implementation until an ML model is trained externally.

import type {
  NoShowFeatureInput,
  NoShowPropensityFeatures,
  NoShowPropensityScore,
  NoShowRiskTier,
} from './no-show-propensity.types';
import { collectRiskRules, DEFAULT_PROPENSITY_CONFIG } from './no-show-propensity.rules';

export type {
  NoShowFeatureInput,
  NoShowPropensityFeatures,
  NoShowPropensityScore,
  NoShowRiskTier,
} from './no-show-propensity.types';
export { DEFAULT_PROPENSITY_CONFIG } from './no-show-propensity.rules';

/** Score an appointment using the rules-based propensity model. */
export function calculateNoShowPropensity(
  features: NoShowPropensityFeatures,
  config: typeof DEFAULT_PROPENSITY_CONFIG = DEFAULT_PROPENSITY_CONFIG
): NoShowPropensityScore {
  const rules = collectRiskRules(features);
  const score = Math.min(1, rules.reduce((sum, rule) => sum + rule.points, 0) / 100);
  const tier: NoShowRiskTier =
    score >= config.mediumThreshold ? 'HIGH' : score >= config.lowThreshold ? 'MEDIUM' : 'LOW';
  const depositPercent =
    tier === 'HIGH'
      ? config.depositHigh
      : tier === 'MEDIUM'
        ? config.depositMedium
        : config.depositLow;

  return {
    score,
    tier,
    requiresDepositHold: tier === 'HIGH',
    depositPercent,
    factors: rules.map((rule) => rule.label),
    modelVersion: 'v1.0-rules-based',
    scoredAt: new Date(),
  };
}

/** Extract features from raw client data, deriving visit frequency. */
export function buildNoShowFeatures(input: NoShowFeatureInput): NoShowPropensityFeatures {
  const visitFrequency30d =
    input.lifetimeVisits > 0 ? Math.min(30, (input.lifetimeVisits / 365) * 30) : 0;
  return { ...input, visitFrequency30d };
}

/** Neutral feature vector used until a feature store is wired in. */
export function defaultNoShowFeatures(): NoShowPropensityFeatures {
  return buildNoShowFeatures({
    lifetimeVisits: 0,
    noShowCount90Days: 0,
    cancellationCount90Days: 0,
    leadHours: 0,
    bookingsLast24h: 0,
    avgSpendPerVisit: 0,
    deviceFingerprintEntropy: 0.5,
    isNewEmailDomain: false,
    isCountryMismatch: false,
    isVpnOrProxy: false,
    isDatacenterIp: false,
  });
}
