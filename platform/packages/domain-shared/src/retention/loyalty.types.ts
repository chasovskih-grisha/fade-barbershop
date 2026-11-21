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
