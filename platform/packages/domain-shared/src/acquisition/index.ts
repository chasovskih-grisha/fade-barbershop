/**
 * FADE Customer Acquisition & Retention Specialist
 * Automated Referral & Retention Booster Module
 */

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
  recommendedAction: 'none' | 'onboarding_nudge' | 'referral_invite' | 'winback_discount' | 'vip_reward';
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

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: 'tier-1',
    name: 'Gentleman Start',
    requiredReferrals: 1,
    referrerDiscountPercent: 15,
    refereeDiscountPercent: 15,
    bonusCreditUah: 100,
    vipPerksUnlocked: false,
  },
  {
    id: 'tier-2',
    name: 'Fade Ambassador',
    requiredReferrals: 3,
    referrerDiscountPercent: 25,
    refereeDiscountPercent: 20,
    bonusCreditUah: 300,
    vipPerksUnlocked: true,
  },
  {
    id: 'tier-3',
    name: 'Elite VIP Circle',
    requiredReferrals: 5,
    referrerDiscountPercent: 40,
    refereeDiscountPercent: 25,
    bonusCreditUah: 600,
    vipPerksUnlocked: true,
  },
];

export function calculateChurnRisk(totalVisits: number, lastVisitDaysAgo: number, lifetimeSpendUah: number): number {
  if (totalVisits === 1 && lastVisitDaysAgo > 21) return 0.85; // High onboarding drop-off risk
  if (lastVisitDaysAgo > 60) return 0.90; // Severe churn risk
  if (lastVisitDaysAgo > 45) return 0.65; // Moderate churn risk
  if (lastVisitDaysAgo > 30) return 0.40; // Watchlist
  return 0.10; // Healthy retention
}

export function evaluateRetentionProfile(clientId: string, totalVisits: number, lastVisitDaysAgo: number, lifetimeSpendUah: number): ClientRetentionProfile {
  const churnRiskScore = calculateChurnRisk(totalVisits, lastVisitDaysAgo, lifetimeSpendUah);
  
  let tier: ClientRetentionProfile['tier'] = 'bronze';
  if (lifetimeSpendUah >= 5000 || totalVisits >= 10) tier = 'platinum';
  else if (lifetimeSpendUah >= 2500 || totalVisits >= 5) tier = 'gold';
  else if (lifetimeSpendUah >= 1000 || totalVisits >= 3) tier = 'silver';

  let recommendedAction: ClientRetentionProfile['recommendedAction'] = 'none';
  if (totalVisits === 1 && lastVisitDaysAgo >= 14 && lastVisitDaysAgo <= 30) {
    recommendedAction = 'onboarding_nudge';
  } else if (churnRiskScore >= 0.65) {
    recommendedAction = 'winback_discount';
  } else if (totalVisits >= 2 && churnRiskScore < 0.3) {
    recommendedAction = 'referral_invite';
  } else if (tier === 'platinum' || tier === 'gold') {
    recommendedAction = 'vip_reward';
  }

  return {
    clientId,
    totalVisits,
    lastVisitDaysAgo,
    lifetimeSpendUah,
    tier,
    churnRiskScore,
    recommendedAction,
  };
}

export function generateReferralCode(clientId: string): string {
  const cleanId = clientId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  return `FADE-${cleanId || 'VIP'}-${Math.floor(100 + Math.random() * 900)}`;
}

export function generateWinbackCampaign(profile: ClientRetentionProfile): WinbackCampaign {
  const segment = profile.lastVisitDaysAgo > 60 ? 'churned_60_plus' : profile.lastVisitDaysAgo > 30 ? 'churned_30_60' : 'at_risk';
  const discountPercent = profile.lastVisitDaysAgo > 60 ? 30 : 20;
  const freeServiceAddon = profile.tier === 'gold' || profile.tier === 'platinum' ? 'beard_trim_or_styling_gel' : undefined;

  return {
    campaignId: `winback-${profile.clientId}-${Date.now()}`,
    name: `FADE Win-Back Campaign (${profile.tier.toUpperCase()})`,
    targetSegment: segment,
    discountVoucherCode: `COMEBACK-${discountPercent}-${Math.floor(1000 + Math.random() * 9000)}`,
    discountPercent,
    freeServiceAddon,
    validityDays: 14,
  };
}
