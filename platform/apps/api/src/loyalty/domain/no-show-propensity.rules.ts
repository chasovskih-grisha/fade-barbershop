// Rules-based scoring rules for T-5009. Each rule is a pure predicate over
// client features; the model only aggregates the rules that match.

import type { NoShowFeatureInput, NoShowRiskRule } from './no-show-propensity.types';

export const DEFAULT_PROPENSITY_CONFIG = {
  // Score thresholds
  lowThreshold: 0.33,
  mediumThreshold: 0.66,
  // Deposit percentages by tier
  depositLow: 0,
  depositMedium: 50,
  depositHigh: 100,
  // Weight config (kept for model-configuration compatibility)
  weights: {
    lifetimeVisits: 0.15,
    noShowCount90Days: 0.25,
    cancellationCount90Days: 0.15,
    leadHours: 0.1,
    bookingsLast24h: 0.15,
    visitFrequency30d: 0.1,
    avgSpendPerVisit: 0.05,
    deviceFingerprintEntropy: 0.05,
    isNewEmailDomain: 0.05,
    isCountryMismatch: 0.05,
    isVpnOrProxy: 0.05,
    isDatacenterIp: 0.03,
  },
};

type RuleEvaluator = (features: NoShowFeatureInput) => NoShowRiskRule | null;

const matched = (label: string, points: number): NoShowRiskRule => ({
  label,
  points,
  matched: true,
});

const EVALUATORS: RuleEvaluator[] = [
  (f) => {
    const ratio = f.noShowCount90Days / Math.max(1, f.lifetimeVisits);
    return ratio > 0 ? matched('historical-no-show-rate', Math.min(30, ratio * 30)) : null;
  },
  (f) =>
    f.noShowCount90Days > 0
      ? matched('recent-no-shows-in-window', Math.min(25, f.noShowCount90Days * 5))
      : null,
  (f) => {
    const ratio = f.cancellationCount90Days / Math.max(1, f.lifetimeVisits);
    return ratio > 0 ? matched('high-cancellation-rate', Math.min(20, ratio * 20)) : null;
  },
  (f) =>
    f.leadHours > 0 && f.leadHours < 48
      ? matched('short-lead-time', f.leadHours < 24 ? Math.min(15, (24 - f.leadHours) * 0.6) : 0)
      : null,
  (f) =>
    f.bookingsLast24h > 0
      ? matched('high-booking-velocity', Math.min(20, f.bookingsLast24h * 3))
      : null,
  (f) =>
    f.deviceFingerprintEntropy > 0 && f.deviceFingerprintEntropy < 0.5
      ? matched(
          'low-device-entropy',
          f.deviceFingerprintEntropy < 0.3
            ? Math.min(15, (0.3 - f.deviceFingerprintEntropy) * 10)
            : 0
        )
      : null,
  (f) => (f.isNewEmailDomain ? matched('new-email-domain', 10) : null),
  (f) => (f.isCountryMismatch ? matched('ip-phone-country-mismatch', 15) : null),
  (f) => (f.isVpnOrProxy ? matched('vpn-or-proxy', 10) : null),
  (f) => (f.isDatacenterIp ? matched('datacenter-ip', 5) : null),
];

/** Collect the rules that match a client's feature vector. */
export function collectRiskRules(features: NoShowFeatureInput): NoShowRiskRule[] {
  return EVALUATORS.map((evaluate) => evaluate(features)).filter(
    (rule): rule is NoShowRiskRule => rule !== null
  );
}
