import type { ReferralTierRequest, ReferralTierResult } from './types';

type TierLevel = ReferralTierResult['tierLevel'];

interface TierConfig {
  tierLevel: TierLevel;
  rewardAmountPerReferral: number;
  perks: string[];
  nextTierThreshold: number | null;
}

function resolveTier(count: number): TierConfig {
  if (count >= 15) {
    return {
      tierLevel: 'ambassador',
      rewardAmountPerReferral: 35,
      perks: [
        'Ambassador status ($35 per referral)',
        'Free monthly haircut',
        'VIP booking line',
        'Exclusive merchandise',
      ],
      nextTierThreshold: null,
    };
  }
  if (count >= 8) {
    return {
      tierLevel: 'gold',
      rewardAmountPerReferral: 25,
      perks: [
        'Gold referral bonus ($25 per referral)',
        'Complimentary beverage upgrade',
        'Priority waitlist',
      ],
      nextTierThreshold: 15,
    };
  }
  if (count >= 3) {
    return {
      tierLevel: 'silver',
      rewardAmountPerReferral: 20,
      perks: ['Silver referral bonus ($20 per referral)', 'Priority slot access'],
      nextTierThreshold: 8,
    };
  }
  return {
    tierLevel: 'bronze',
    rewardAmountPerReferral: 15,
    perks: ['Standard referral bonus ($15)'],
    nextTierThreshold: 3,
  };
}

/**
 * Calculate referral tier incentives based on successful referral volume.
 */
export function calculateReferralTier(request: ReferralTierRequest): ReferralTierResult {
  const tier = resolveTier(request.successfulReferralsCount);
  return { referrerId: request.referrerId, ...tier };
}
