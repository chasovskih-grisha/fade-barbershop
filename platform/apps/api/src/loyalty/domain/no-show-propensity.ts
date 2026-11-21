// No-Show Propensity Scoring (T-5009)
// LightGBM-like binary classification model scoring each appointment 0.0 to 1.0
// Rules-based implementation until ML model is trained externally

export interface NoShowPropensityFeatures {
  /** Client lifetime visit count */
  lifetimeVisits: number;
  /** Client no-show count in rolling window */ 
  noShowCount90Days: number;
  /** Client cancellation count in rolling window */
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

export const DEFAULT_PROPENSITY_CONFIG = {
  // Score thresholds
  lowThreshold: 0.33,
  mediumThreshold: 0.66,
  // Deposit percentages by tier
  depositLow: 0,
  depositMedium: 50,
  depositHigh: 100,
  // Weight config
  weights: {
    lifetimeVisits: 0.15,
    noShowCount90Days: 0.25,
    cancellationCount90Days: 0.15,
    leadHours: 0.10,
    bookingsLast24h: 0.15,
    visitFrequency30d: 0.10,
    avgSpendPerVisit: 0.05,
    deviceFingerprintEntropy: 0.05,
    isNewEmailDomain: 0.05,
    isCountryMismatch: 0.05,
    isVpnOrProxy: 0.05,
    isDatacenterIp: 0.03,
  },
};

/**
 * Calculate no-show propensity score based on client features.
 * Returns a score from 0.0 to 1.0 and risk tier with deposit requirements.
 */
export function calculateNoShowPropensity(
  features: NoShowPropensityFeatures,
  config: typeof DEFAULT_PROPENSITY_CONFIG = DEFAULT_PROPENSITY_CONFIG
): NoShowPropensityScore {
  // Calculate weighted rule points (0-100 scale)
  const rules: { label: string; points: number; matched: boolean }[] = [];

  // Rule 1: History of no-shows (highest weight)
  const noShowRatio = features.noShowCount90Days / Math.max(1, features.lifetimeVisits);
  const noShowPoints = Math.min(30, noShowRatio * 30);
  if (noShowRatio > 0) {
    rules.push({
      label: 'historical-no-show-rate',
      points: noShowPoints,
      matched: true,
    });
  }

  // Rule 2: Recent no-shows in window
  const recentNoShowPoints = Math.min(25, features.noShowCount90Days * 5);
  if (features.noShowCount90Days > 0) {
    rules.push({
      label: 'recent-no-shows-in-window',
      points: recentNoShowPoints,
      matched: true,
    });
  }

  // Rule 3: High cancellation rate
  const cancellationRatio = features.cancellationCount90Days / Math.max(1, features.lifetimeVisits);
  const cancellationPoints = Math.min(20, cancellationRatio * 20);
  if (cancellationRatio > 0) {
    rules.push({
      label: 'high-cancellation-rate',
      points: cancellationPoints,
      matched: true,
    });
  }

  // Rule 4: Short lead time (last-minute bookings correlate with no-shows)
  const leadHoursPoints = features.leadHours < 24 ? Math.min(15, (24 - features.leadHours) * 0.6) : 0;
  if (features.leadHours > 0 && features.leadHours < 48) {
    rules.push({
      label: 'short-lead-time',
      points: leadHoursPoints,
      matched: true,
    });
  }

  // Rule 5: High booking velocity
  const velocityPoints = Math.min(20, features.bookingsLast24h * 3);
  if (features.bookingsLast24h > 0) {
    rules.push({
      label: 'high-booking-velocity',
      points: velocityPoints,
      matched: true,
    });
  }

  // Rule 6: Low device entropy (script-like behavior)
  const entropyPoints = features.deviceFingerprintEntropy < 0.3 
    ? Math.min(15, (0.3 - features.deviceFingerprintEntropy) * 10) 
    : 0;
  if (features.deviceFingerprintEntropy > 0 && features.deviceFingerprintEntropy < 0.5) {
    rules.push({
      label: 'low-device-entropy',
      points: entropyPoints,
      matched: true,
    });
  }

  // Rule 7: New email domain
  if (features.isNewEmailDomain) {
    rules.push({
      label: 'new-email-domain',
      points: 10,
      matched: true,
    });
  }

  // Rule 8: Country mismatch
  if (features.isCountryMismatch) {
    rules.push({
      label: 'ip-phone-country-mismatch',
      points: 15,
      matched: true,
    });
  }

  // Rule 9: VPN/proxy detection
  if (features.isVpnOrProxy) {
    rules.push({
      label: 'vpn-or-proxy',
      points: 10,
      matched: true,
    });
  }

  // Rule 10: Datacenter IP
  if (features.isDatacenterIp) {
    rules.push({
      label: 'datacenter-ip',
      points: 5,
      matched: true,
    });
  }

  // Calculate total score (0-100), then normalize to 0.0-1.0
  const totalPoints = rules.reduce((sum, r) => sum + r.points, 0);
  const score = Math.min(1.0, totalPoints / 100);

  // Determine risk tier
  let tier: 'LOW' | 'MEDIUM' | 'HIGH';
  let depositPercent: number;
  if (score >= DEFAULT_PROPENSITY_CONFIG.mediumThreshold) {
    tier = 'HIGH';
    depositPercent = DEFAULT_PROPENSITY_CONFIG.depositHigh;
  } else if (score >= DEFAULT_PROPENSITY_CONFIG.lowThreshold) {
    tier = 'MEDIUM';
    depositPercent = DEFAULT_PROPENSITY_CONFIG.depositMedium;
  } else {
    tier = 'LOW';
    depositPercent = DEFAULT_PROPENSITY_CONFIG.depositLow;
  }

  return {
    score,
    tier,
    requiresDepositHold: tier === 'HIGH',
    depositPercent,
    factors: rules
      .filter((r) => r.matched)
      .map((r) => r.label),
    modelVersion: 'v1.0-rules-based',
    scoredAt: new Date(),
  };
}

/** Feature builder: extract features from client profile and booking context */
export function buildNoShowFeatures(
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
  // Calculate visit frequency (visits per 30 days, assuming client started ~365 days ago)
  const visitFrequency30d = lifetimeVisits > 0 ? Math.min(30, (lifetimeVisits / 365) * 30) : 0;

  return {
    lifetimeVisits,
    noShowCount90Days,
    cancellationCount90Days,
    leadHours,
    bookingsLast24h,
    visitFrequency30d,
    avgSpendPerVisit,
    deviceFingerprintEntropy,
    isNewEmailDomain,
    isCountryMismatch,
    isVpnOrProxy,
    isDatacenterIp,
  };
}