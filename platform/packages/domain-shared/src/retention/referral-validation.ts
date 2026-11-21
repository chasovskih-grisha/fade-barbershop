import type { ReferralAttributionRequest, ReferralValidationResult } from './types';

function invalid(reason: string): ReferralValidationResult {
  return {
    valid: false,
    reason,
    refereeDiscountPct: 0,
    referrerRewardBonus: 0,
  };
}

/**
 * Validate referral attribution adhering to ADR 0014 (anti-self-referral & anti-fraud).
 */
export function validateReferral(request: ReferralAttributionRequest): ReferralValidationResult {
  if (request.referrerId === request.refereeId) {
    return invalid('self_referral_prohibited');
  }

  if (!request.referralCode || request.referralCode.trim().length < 4) {
    return invalid('invalid_referral_code');
  }

  return {
    valid: true,
    refereeDiscountPct: 20,
    referrerRewardBonus: 15,
  };
}
