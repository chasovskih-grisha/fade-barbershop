export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'VIP';

export interface LoyaltyAccount {
  customerId: string;
  points: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  giftCardBalanceCents: number;
  joinDate: string;
  birthday?: string;
  referralCode?: string;
  referredBy?: string;
  consecutiveVisits?: number;
}

export interface LoyaltyRule {
  pointsPerDollar: number;
  tierMultipliers: Record<LoyaltyTier, number>;
  tierThresholds: Record<LoyaltyTier, number>;
  redemptionRateCentsPerPoint: number;
  birthdayBonusPoints: number;
  referralBonusPoints: number;
  streakBonusThreshold: number;
  streakBonusPoints: number;
}

export interface AccrualInput {
  account: LoyaltyAccount;
  spendCents: number;
  isBirthday?: boolean;
  isReferral?: boolean;
  completedVisit?: boolean;
}

export interface AccrualResult {
  pointsEarned: number;
  newPointsTotal: number;
  newLifetimePoints: number;
  newTier: LoyaltyTier;
  bonusApplied?: string[];
  newConsecutiveVisits: number;
}

export interface RedemptionInput {
  account: LoyaltyAccount;
  pointsToRedeem: number;
  purchaseAmountCents: number;
}

export interface RedemptionResult {
  discountCents: number;
  remainingPoints: number;
  remainingGiftCardBalanceCents: number;
}

export interface VIPPerkEvaluationInput {
  account: LoyaltyAccount;
  serviceCategory: string;
  isPeakHour: boolean;
}

export interface VIPPerkEvaluationResult {
  discountPercent: number;
  priorityBookingGranted: boolean;
  complimentaryUpgradeEligible: boolean;
  perkDescription: string;
}

export interface MembershipUpgradeInput {
  account: LoyaltyAccount;
  targetTier: LoyaltyTier;
  paymentCents: number;
}

export interface MembershipUpgradeResult {
  account: LoyaltyAccount;
  upgraded: boolean;
  message: string;
}

