export interface ReferralTier {
  id: string;
  name: string;
  requiredReferrals: number;
  referrerDiscountPercent: number;
  refereeDiscountPercent: number;
  bonusCreditUah: number;
  vipPerksUnlocked: boolean;
}

export interface ClientRetentionProfile {
  clientId: string;
  totalVisits: number;
  lastVisitDaysAgo: number;
  lifetimeSpendUah: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  churnRiskScore: number; // 0 to 1
  recommendedAction:
    'none' | 'onboarding_nudge' | 'referral_invite' | 'winback_discount' | 'vip_reward';
}

export interface RetentionProfileInput {
  clientId: string;
  totalVisits: number;
  lastVisitDaysAgo: number;
  lifetimeSpendUah: number;
}

export interface WinbackCampaign {
  campaignId: string;
  name: string;
  targetSegment: 'at_risk' | 'churned_30_60' | 'churned_60_plus' | 'one_time_dropoff';
  discountVoucherCode: string;
  discountPercent: number;
  freeServiceAddon: string | undefined;
  validityDays: number;
}
