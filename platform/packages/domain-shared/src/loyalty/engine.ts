import { LoyaltyTier, LoyaltyAccount, LoyaltyRule, AccrualInput, AccrualResult, RedemptionInput, RedemptionResult, VIPPerkEvaluationInput, VIPPerkEvaluationResult, MembershipUpgradeInput, MembershipUpgradeResult } from './types';

export const DEFAULT_LOYALTY_RULE: LoyaltyRule = {
  pointsPerDollar: 10,
  tierMultipliers: {
    BRONZE: 1.0,
    SILVER: 1.25,
    GOLD: 1.5,
    PLATINUM: 2.0,
    VIP: 3.0,
  },
  tierThresholds: {
    BRONZE: 0,
    SILVER: 1000,
    GOLD: 5000,
    PLATINUM: 15000,
    VIP: 35000,
  },
  redemptionRateCentsPerPoint: 1,
  birthdayBonusPoints: 500,
  referralBonusPoints: 250,
  streakBonusThreshold: 3,
  streakBonusPoints: 150,
};

export const TIER_UPGRADE_COSTS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 5000, // $50
  GOLD: 15000, // $150
  PLATINUM: 35000, // $350
  VIP: 75000, // $750
};

export class LoyaltyEngine {
  private rule: LoyaltyRule;

  constructor(rule: LoyaltyRule = DEFAULT_LOYALTY_RULE) {
    this.rule = rule;
  }

  public calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= this.rule.tierThresholds.VIP) return 'VIP';
    if (lifetimePoints >= this.rule.tierThresholds.PLATINUM) return 'PLATINUM';
    if (lifetimePoints >= this.rule.tierThresholds.GOLD) return 'GOLD';
    if (lifetimePoints >= this.rule.tierThresholds.SILVER) return 'SILVER';
    return 'BRONZE';
  }

  public accruePoints(input: AccrualInput): AccrualResult {
    const { account, spendCents, isBirthday, isReferral, completedVisit } = input;
    const dollars = spendCents / 100;
    const multiplier = this.rule.tierMultipliers[account.tier] || 1.0;
    
    let basePoints = Math.floor(dollars * this.rule.pointsPerDollar * multiplier);
    const bonusApplied: string[] = [];

    if (isBirthday) {
      basePoints += this.rule.birthdayBonusPoints;
      bonusApplied.push('BIRTHDAY_BONUS');
    }

    if (isReferral) {
      basePoints += this.rule.referralBonusPoints;
      bonusApplied.push('REFERRAL_BONUS');
    }

    let newConsecutiveVisits = account.consecutiveVisits || 0;
    if (completedVisit) {
      newConsecutiveVisits += 1;
      if (newConsecutiveVisits >= this.rule.streakBonusThreshold) {
        basePoints += this.rule.streakBonusPoints;
        bonusApplied.push('STREAK_BONUS');
        newConsecutiveVisits = 0; // reset streak after bonus
      }
    }

    const newLifetimePoints = account.lifetimePoints + basePoints;
    const newPointsTotal = account.points + basePoints;
    const newTier = this.calculateTier(newLifetimePoints);

    return {
      pointsEarned: basePoints,
      newPointsTotal,
      newLifetimePoints,
      newTier,
      bonusApplied,
      newConsecutiveVisits,
    };
  }

  public redeemPoints(input: RedemptionInput): RedemptionResult {
    const { account, pointsToRedeem, purchaseAmountCents } = input;
    if (pointsToRedeem <= 0) {
      return {
        discountCents: 0,
        remainingPoints: account.points,
        remainingGiftCardBalanceCents: account.giftCardBalanceCents,
      };
    }

    if (pointsToRedeem > account.points) {
      throw new Error(`Insufficient loyalty points. Requested: ${pointsToRedeem}, Available: ${account.points}`);
    }

    const maxDiscountFromPointsCents = pointsToRedeem * this.rule.redemptionRateCentsPerPoint;
    const discountCents = Math.min(maxDiscountFromPointsCents, purchaseAmountCents);
    
    const pointsConsumed = Math.ceil(discountCents / this.rule.redemptionRateCentsPerPoint);
    const remainingPoints = account.points - pointsConsumed;

    return {
      discountCents,
      remainingPoints,
      remainingGiftCardBalanceCents: account.giftCardBalanceCents,
    };
  }

  public redeemGiftCard(account: LoyaltyAccount, giftCardAmountCents: number): { newGiftCardBalanceCents: number } {
    if (giftCardAmountCents <= 0) {
      throw new Error('Gift card redemption amount must be positive');
    }
    if (giftCardAmountCents > account.giftCardBalanceCents) {
      throw new Error(`Insufficient gift card balance. Requested: ${giftCardAmountCents}, Available: ${account.giftCardBalanceCents}`);
    }

    return {
      newGiftCardBalanceCents: account.giftCardBalanceCents - giftCardAmountCents,
    };
  }

  public evaluateVIPPerks(input: VIPPerkEvaluationInput): VIPPerkEvaluationResult {
    const { account, serviceCategory, isPeakHour } = input;
    let discountPercent = 0;
    let priorityBookingGranted = false;
    let complimentaryUpgradeEligible = false;
    let perkDescription = 'Standard member privileges.';

    switch (account.tier) {
      case 'VIP':
        discountPercent = 15;
        priorityBookingGranted = true;
        complimentaryUpgradeEligible = true;
        perkDescription = 'VIP 15% off, Priority Booking, Complimentary Beard Trim / Beverage Upgrade.';
        break;
      case 'PLATINUM':
        discountPercent = 10;
        priorityBookingGranted = true;
        complimentaryUpgradeEligible = true;
        perkDescription = 'Platinum 10% off, Priority Booking, Complimentary Beverage Upgrade.';
        break;
      case 'GOLD':
        discountPercent = 5;
        priorityBookingGranted = !isPeakHour;
        complimentaryUpgradeEligible = false;
        perkDescription = 'Gold 5% off, Off-peak Priority Booking.';
        break;
      case 'SILVER':
        discountPercent = 0;
        priorityBookingGranted = false;
        complimentaryUpgradeEligible = false;
        perkDescription = 'Silver tier status active. Earn 1.25x points on all services.';
        break;
      case 'BRONZE':
      default:
        discountPercent = 0;
        perkDescription = 'Bronze tier status active.';
        break;
    }

    return {
      discountPercent,
      priorityBookingGranted,
      complimentaryUpgradeEligible,
      perkDescription,
    };
  }

  public upgradeMembership(input: MembershipUpgradeInput): MembershipUpgradeResult {
    const { account, targetTier, paymentCents } = input;
    const requiredCostCents = TIER_UPGRADE_COSTS[targetTier];

    if (requiredCostCents === undefined) {
      throw new Error(`Invalid target tier: ${targetTier}`);
    }

    const tierRanks: Record<LoyaltyTier, number> = {
      BRONZE: 0,
      SILVER: 1,
      GOLD: 2,
      PLATINUM: 3,
      VIP: 4,
    };

    if (tierRanks[targetTier] <= tierRanks[account.tier]) {
      return {
        account,
        upgraded: false,
        message: `Account is already at tier ${account.tier}, which is equal or higher than target ${targetTier}.`,
      };
    }

    if (paymentCents < requiredCostCents) {
      throw new Error(`Insufficient payment for tier upgrade to ${targetTier}. Required: ${requiredCostCents} cents, Provided: ${paymentCents} cents`);
    }

    const threshold = this.rule.tierThresholds[targetTier];
    const newLifetimePoints = Math.max(account.lifetimePoints, threshold);
    const updatedAccount: LoyaltyAccount = {
      ...account,
      tier: targetTier,
      lifetimePoints: newLifetimePoints,
    };

    return {
      account: updatedAccount,
      upgraded: true,
      message: `Successfully upgraded membership to ${targetTier}.`,
    };
  }
}

