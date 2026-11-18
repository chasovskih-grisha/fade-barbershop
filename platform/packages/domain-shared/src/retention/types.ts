export type InactivityTier = '30_days' | '60_days' | '90_plus_days';

export interface WinBackCampaignRequest {
  clientId: string;
  lastVisitDate: string; // ISO date
  currentDate?: string; // ISO date, defaults to now
  previousVisitsCount: number;
}

export interface WinBackCampaignResult {
  clientId: string;
  inactivityDays: number;
  tier: InactivityTier | 'active';
  eligible: boolean;
  discountPercentage: number;
  bonusPerk?: string;
  promoCode: string;
  expiresAt: string;
}

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

export interface RetentionMilestoneRequest {
  clientId: string;
  completedVisits: number;
  totalSpent: number;
  lastVisitDaysAgo: number;
}

export interface RetentionMilestoneResult {
  clientId: string;
  currentTier: 'standard' | 'silver' | 'gold' | 'vip';
  nextMilestoneVisits: number;
  milestoneBonusAvailable: boolean;
  retentionScore: number; // 0 - 100
}

export interface OnboardingSequenceRequest {
  clientId: string;
  clientName: string;
  registrationDate: string;
  completedFirstVisit: boolean;
  daysSinceRegistration: number;
}

export interface OnboardingStep {
  stepDay: number;
  channel: 'sms' | 'push' | 'whatsapp';
  templateKey: string;
  incentiveCode?: string;
  description: string;
}

export interface OnboardingSequenceResult {
  clientId: string;
  currentStage: 'welcome' | 'first_rebooking' | 'referral_prompt' | 'completed';
  nextScheduledStep?: OnboardingStep;
  availableSteps: OnboardingStep[];
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

export interface RetentionStreakRequest {
  clientId: string;
  consecutiveOnTimeVisits: number;
  currentTier: 'standard' | 'silver' | 'gold' | 'vip';
}

export interface RetentionStreakResult {
  clientId: string;
  streakBonusMultiplier: number;
  unlockedPerks: string[];
  loyaltyMultiplierCredits: number;
}

export interface ClientBirthdayAnniversaryRequest {
  clientId: string;
  clientName: string;
  membershipMonths: number;
  totalVisits: number;
  isBirthdayMonth: boolean;
  isAnniversaryMonth: boolean;
}

export interface ClientBirthdayAnniversaryResult {
  clientId: string;
  eligibleForBirthdayBonus: boolean;
  eligibleForAnniversaryBonus: boolean;
  birthdayVoucherCode: string;
  anniversaryBonusCreditUah: number;
  vipConciergeUnlocked: boolean;
  recommendedPerks: string[];
}

