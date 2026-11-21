/* eslint-disable max-lines, complexity, max-statements -- cohesive module (127 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: optimizeCancellationPolicy, complexity 31 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: optimizeCancellationPolicy, 37 statements vs 30); extraction tracked in T-2500f */
export interface CancellationContext {
  hoursBeforeAppointment: number;
  clientHistoricalNoShowRate: number; // 0.0 to 1.0
  isPeakSurgeSlot: boolean;
  servicePrice: number;
  isVipClient?: boolean;
  isFirstTimeClient?: boolean;
  expressCreditOptIn?: boolean;
}

export interface CancellationPolicyResult {
  policyTier: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE';
  riskScore: number; // 0.0 to 1.0
  refundPercentage: number; // 0 to 100
  feeAmount: number;
  waitlistPriorityBonus: boolean;
  reason: string;
}

export interface CancellationOptimizerConfig {
  flexibleWindowHours: number; // e.g. 24
  strictWindowHours: number; // e.g. 6
  noShowPenaltyWeight: number; // e.g. 0.4
  peakSurgePenaltyWeight: number; // e.g. 0.2
}

export const DEFAULT_CANCELLATION_CONFIG: CancellationOptimizerConfig = {
  flexibleWindowHours: 24,
  strictWindowHours: 6,
  noShowPenaltyWeight: 0.4,
  peakSurgePenaltyWeight: 0.2,
};

/**
 * Optimizes cancellation policies, refund calculations, and risk assessment for appointments.
 */
export function optimizeCancellationPolicy(
  context: CancellationContext,
  config: CancellationOptimizerConfig = DEFAULT_CANCELLATION_CONFIG
): CancellationPolicyResult {
  const {
    hoursBeforeAppointment,
    clientHistoricalNoShowRate,
    isPeakSurgeSlot,
    servicePrice,
    isVipClient,
    isFirstTimeClient,
    expressCreditOptIn,
  } = context;

  // Calculate risk score
  let timeFactor = 0;
  if (hoursBeforeAppointment >= config.flexibleWindowHours) {
    timeFactor = 0.0;
  } else if (hoursBeforeAppointment <= config.strictWindowHours) {
    timeFactor = 1.0;
  } else {
    timeFactor = Number(
      (
        (config.flexibleWindowHours - hoursBeforeAppointment) /
        (config.flexibleWindowHours - config.strictWindowHours)
      ).toFixed(4)
    );
  }

  const noShowFactor = Math.min(1.0, Math.max(0, clientHistoricalNoShowRate));
  const peakFactor = isPeakSurgeSlot ? 1.0 : 0.0;

  let riskScore = Number(
    Math.min(
      1.0,
      Math.max(
        0,
        timeFactor * 0.4 +
          noShowFactor * config.noShowPenaltyWeight +
          peakFactor * config.peakSurgePenaltyWeight
      )
    ).toFixed(4)
  );

  if (isVipClient) {
    riskScore = Number((riskScore * 0.75).toFixed(4));
  } else if (isFirstTimeClient) {
    // Gentle onboarding buffer for first-time clients reducing perceived friction
    riskScore = Number((riskScore * 0.9).toFixed(4));
  }

  let policyTier: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE' = 'FLEXIBLE';
  let refundPercentage = 100;

  if (hoursBeforeAppointment >= config.flexibleWindowHours && riskScore < 0.3) {
    policyTier = 'FLEXIBLE';
    refundPercentage = 100;
  } else if (hoursBeforeAppointment >= config.strictWindowHours && riskScore < 0.6) {
    policyTier = 'MODERATE';
    refundPercentage = isVipClient ? 90 : isFirstTimeClient ? 85 : 75;
  } else if (hoursBeforeAppointment > 2 && riskScore < 0.85) {
    policyTier = 'STRICT';
    refundPercentage = isVipClient ? 75 : isFirstTimeClient ? 65 : 50;
  } else {
    policyTier =
      (isVipClient || isFirstTimeClient) && hoursBeforeAppointment >= 1
        ? 'STRICT'
        : 'NON_REFUNDABLE';
    refundPercentage =
      (isVipClient || isFirstTimeClient) && hoursBeforeAppointment >= 1
        ? isVipClient
          ? 50
          : 40
        : expressCreditOptIn
          ? 25
          : 0;
  }

  const feeAmount = Number((servicePrice * ((100 - refundPercentage) / 100)).toFixed(2));
  const waitlistPriorityBonus = hoursBeforeAppointment >= config.flexibleWindowHours;

  let reason = `Cancellation requested ${hoursBeforeAppointment}h prior. `;
  if (isVipClient) {
    reason += 'VIP client leniency applied. ';
  } else if (isFirstTimeClient) {
    reason += 'First-time client onboarding leniency applied. ';
  }
  if (expressCreditOptIn && refundPercentage > 0) {
    reason += 'Express credit opt-in bonus applied. ';
  }
  if (policyTier === 'FLEXIBLE') {
    reason += 'Full refund granted under flexible window and low risk.';
  } else if (policyTier === 'MODERATE') {
    reason += `Partial refund (${refundPercentage}%) applied due to moderate notice/risk.`;
  } else if (policyTier === 'STRICT') {
    reason += `Partial refund (${refundPercentage}%) applied due to short notice or elevated risk.`;
  } else {
    reason += 'Non-refundable due to very late notice or high risk profile.';
  }

  return {
    policyTier,
    riskScore,
    refundPercentage,
    feeAmount,
    waitlistPriorityBonus,
    reason,
  };
}
