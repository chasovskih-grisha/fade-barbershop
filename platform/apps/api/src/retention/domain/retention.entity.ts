export type ReactivationTriggerType = 'INACTIVE_30_DAYS' | 'INACTIVE_60_DAYS' | 'INACTIVE_90_DAYS' | 'POST_CANCELLATION';

export interface ReactivationFlowEntity {
  id: string;
  clientId: string;
  clientEmail: string;
  clientPhone: string;
  triggerType: ReactivationTriggerType;
  lastVisitDate: string;
  daysInactive: number;
  incentiveCode: string;
  discountPercentage: number;
  status: 'PENDING' | 'SENT' | 'REDEEMED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface ClientOnboardingSequenceEntity {
  id: string;
  clientId: string;
  clientEmail: string;
  clientPhone: string;
  currentStep: 'WELCOME_SMS' | 'PROFILE_COMPLETION' | 'FIRST_BOOKING_DISCOUNT' | 'COMPLETED';
  welcomeSentAt?: string;
  profileCompletedAt?: string;
  discountClaimedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetentionIncentiveEntity {
  id: string;
  clientId: string;
  tier: 'SILVER' | 'GOLD' | 'VIP';
  pointsBalance: number;
  unlockedPerks: string[];
  expiresAt: string;
  updatedAt: string;
}

export interface MilestoneRewardEntity {
  id: string;
  clientId: string;
  visitCount: number;
  milestoneTitle: string;
  bonusPoints: number;
  unlockedPerk: string;
  awardedAt: string;
}

