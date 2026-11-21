export interface ReferralAttributionRequest {
  referrerId: string;
  refereeId: string;
  referralCode: string;
  refereeIp?: string;
  refereeDeviceId?: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  reason?: string;
  refereeDiscountPct: number;
  referrerRewardBonus: number;
}

export interface ReferralTierRequest {
  referrerId: string;
  successfulReferralsCount: number;
}

export interface ReferralTierResult {
  referrerId: string;
  tierLevel: 'bronze' | 'silver' | 'gold' | 'ambassador';
  rewardAmountPerReferral: number;
  perks: string[];
  nextTierThreshold: number | null;
}

export interface SmartReferralBoosterRequest {
  referrerId: string;
  currentDate?: string;
  baseReward: number;
  isWeekend?: boolean;
  activeCampaignCode?: string;
}

export interface SmartReferralBoosterResult {
  referrerId: string;
  boostActive: boolean;
  multiplier: number;
  boostedReward: number;
  campaignTitle: string;
  expiresInHours: number;
}
