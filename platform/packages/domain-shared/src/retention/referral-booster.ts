import type { SmartReferralBoosterRequest, SmartReferralBoosterResult } from './types';

interface BoostConfig {
  multiplier: number;
  campaignTitle: string;
  boostActive: boolean;
}

function resolveBoost(request: SmartReferralBoosterRequest): BoostConfig {
  if (request.activeCampaignCode === 'FADE-VIP-SURGE') {
    return {
      multiplier: 1.5,
      campaignTitle: 'VIP Weekend Acquisition Surge',
      boostActive: true,
    };
  }
  if (request.isWeekend) {
    return {
      multiplier: 1.25,
      campaignTitle: 'Weekend Referral Bonus Booster',
      boostActive: true,
    };
  }
  return {
    multiplier: 1.0,
    campaignTitle: 'Standard Referral Program',
    boostActive: false,
  };
}

/**
 * Calculate smart referral boost multiplier during peak acquisition windows or active campaigns.
 */
export function calculateSmartReferralBooster(
  request: SmartReferralBoosterRequest
): SmartReferralBoosterResult {
  const boost = resolveBoost(request);
  return {
    referrerId: request.referrerId,
    boostActive: boost.boostActive,
    multiplier: boost.multiplier,
    boostedReward: Math.round(request.baseReward * boost.multiplier),
    campaignTitle: boost.campaignTitle,
    expiresInHours: boost.boostActive ? 48 : 0,
  };
}
