/**
 * FADE Loyalty & Membership Programs Specialist Engine
 * Manages loyalty tiers, reward points calculation, VIP perks, automated discounts, and gift card redemption logic.
 */

export type LoyaltyTierLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'VIP';

export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: LoyaltyTierLevel;
  pointsBalance: number;
  lifetimePointsEarned: number;
  totalSpent: number;
  visitCount: number;
  joinedDate: Date;
  activeMembershipId?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  monthlyFee: number;
  tierGranted: LoyaltyTierLevel;
  discountPercentage: number;
  complimentaryHaircutsPerYear: number;
  priorityBooking: boolean;
  freeBeardTrims: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue?: number;
  serviceCode?: string;
}

export interface GiftCard {
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  isRedeemed: boolean;
  purchasedBy: string;
  expiresAt?: Date;
}

export interface TransactionCheckoutContext {
  memberId: string;
  subtotal: number;
  serviceCodes: string[];
  pointsToRedeem?: number;
  giftCardCode?: string;
  membershipPlanId?: string;
}

export interface TransactionCheckoutResult {
  subtotal: number;
  discountAmount: number;
  pointsRedeemed: number;
  pointsEarned: number;
  giftCardDeduction: number;
  finalTotal: number;
  tierApplied: LoyaltyTierLevel;
  perksApplied: string[];
}

export class LoyaltyMembershipEngine {
  private membershipPlans: Map<string, MembershipPlan> = new Map([
    ['plan_bronze', { id: 'plan_bronze', name: 'FADE Standard', monthlyFee: 0, tierGranted: 'BRONZE', discountPercentage: 0, complimentaryHaircutsPerYear: 0, priorityBooking: false, freeBeardTrims: false }],
    ['plan_silver', { id: 'plan_silver', name: 'FADE Grooming Club', monthlyFee: 29.99, tierGranted: 'SILVER', discountPercentage: 10, complimentaryHaircutsPerYear: 1, priorityBooking: true, freeBeardTrims: false }],
    ['plan_gold', { id: 'plan_gold', name: 'FADE Executive Club', monthlyFee: 49.99, tierGranted: 'GOLD', discountPercentage: 15, complimentaryHaircutsPerYear: 2, priorityBooking: true, freeBeardTrims: true }],
    ['plan_vip', { id: 'plan_vip', name: 'FADE Presidential VIP', monthlyFee: 89.99, tierGranted: 'VIP', discountPercentage: 25, complimentaryHaircutsPerYear: 4, priorityBooking: true, freeBeardTrims: true }]
  ]);

  private rewardCatalog: RewardItem[] = [
    { id: 'rew_10off', title: '$10 Off Any Service', description: 'Redeem 100 points for $10 off your next haircut or grooming service.', pointsCost: 100, discountValue: 10 },
    { id: 'rew_25off', title: '$25 Off Any Service', description: 'Redeem 220 points for $25 off your next grooming session.', pointsCost: 220, discountValue: 25 },
    { id: 'rew_free_beard', title: 'Complimentary Beard Trim', description: 'Redeem 150 points for a free professional beard sculpting session.', pointsCost: 150, serviceCode: 'BEARD_TRIM' },
    { id: 'rew_free_cut', title: 'Complimentary Signature Haircut', description: 'Redeem 400 points for a complimentary signature haircut.', pointsCost: 400, serviceCode: 'SIGNATURE_CUT' }
  ];

  private giftCards: Map<string, GiftCard> = new Map([
    ['GC-FADE-100', { code: 'GC-FADE-100', initialBalance: 100, currentBalance: 100, currency: 'USD', isRedeemed: false, purchasedBy: 'admin' }],
    ['GC-FADE-50', { code: 'GC-FADE-50', initialBalance: 50, currentBalance: 50, currency: 'USD', isRedeemed: false, purchasedBy: 'admin' }]
  ]);

  /**
   * Evaluates and updates member tier based on lifetime points or total spent.
   */
  public evaluateTier(member: LoyaltyMember): LoyaltyTierLevel {
    const { lifetimePointsEarned, totalSpent } = member;
    if (lifetimePointsEarned >= 2500 || totalSpent >= 1000) {
      return 'VIP';
    } else if (lifetimePointsEarned >= 1500 || totalSpent >= 600) {
      return 'PLATINUM';
    } else if (lifetimePointsEarned >= 800 || totalSpent >= 300) {
      return 'GOLD';
    } else if (lifetimePointsEarned >= 300 || totalSpent >= 120) {
      return 'SILVER';
    }
    return 'BRONZE';
  }

  /**
   * Calculates points earned on a transaction amount based on member tier.
   */
  public calculatePointsEarned(tier: LoyaltyTierLevel, amountSpent: number): number {
    let multiplier = 10; // 10 points per dollar for BRONZE
    switch (tier) {
      case 'SILVER':
        multiplier = 12;
        break;
      case 'GOLD':
        multiplier = 15;
        break;
      case 'PLATINUM':
        multiplier = 18;
        break;
      case 'VIP':
        multiplier = 20;
        break;
    }
    return Math.floor(amountSpent * multiplier);
  }

  /**
   * Processes a transaction checkout with loyalty discounts, point redemption, and gift cards.
   */
  public processCheckout(member: LoyaltyMember, context: TransactionCheckoutContext): TransactionCheckoutResult {
    let subtotal = context.subtotal;
    let discountAmount = 0;
    const perksApplied: string[] = [];

    // Apply membership tier discount
    const plan = member.activeMembershipId ? this.membershipPlans.get(member.activeMembershipId) : null;
    let tier = member.tier;
    if (plan) {
      tier = plan.tierGranted;
      perksApplied.push(`Membership Tier Perk: ${plan.name} (${plan.discountPercentage}% off)`);
      if (plan.priorityBooking) perksApplied.push('Priority Booking Privilege');
      if (plan.freeBeardTrims) perksApplied.push('Complimentary Beard Trim Perk Eligible');
      discountAmount += (subtotal * plan.discountPercentage) / 100;
    } else {
      // Base tier percentage discounts if any
      if (tier === 'VIP') {
        discountAmount += (subtotal * 20) / 100;
        perksApplied.push('VIP Tier 20% Discount');
      } else if (tier === 'PLATINUM') {
        discountAmount += (subtotal * 15) / 100;
        perksApplied.push('Platinum Tier 15% Discount');
      } else if (tier === 'GOLD') {
        discountAmount += (subtotal * 10) / 100;
        perksApplied.push('Gold Tier 10% Discount');
      }
    }

    let taxableAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Points redemption
    let pointsRedeemed = 0;
    if (context.pointsToRedeem && context.pointsToRedeem > 0) {
      if (member.pointsBalance >= context.pointsToRedeem) {
        pointsRedeemed = context.pointsToRedeem;
        // 100 points = $10 discount value
        const pointsDiscountValue = (pointsRedeemed / 100) * 10;
        discountAmount += pointsDiscountValue;
        perksApplied.push(`Redeemed ${pointsRedeemed} loyalty points for $${pointsDiscountValue.toFixed(2)} off`);
      }
    }

    taxableAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Gift card deduction
    let giftCardDeduction = 0;
    if (context.giftCardCode) {
      const gc = this.giftCards.get(context.giftCardCode);
      if (gc && !gc.isRedeemed && gc.currentBalance > 0) {
        giftCardDeduction = Math.min(taxableAfterDiscount, gc.currentBalance);
        perksApplied.push(`Applied Gift Card ${gc.code} ($${giftCardDeduction.toFixed(2)})`);
      }
    }

    const finalTotal = Math.max(0, taxableAfterDiscount - giftCardDeduction);

    // Points earned on final cash/card spent
    const pointsEarned = this.calculatePointsEarned(tier, finalTotal);

    return {
      subtotal,
      discountAmount: Number(discountAmount.toFixed(2)),
      pointsRedeemed,
      pointsEarned,
      giftCardDeduction: Number(giftCardDeduction.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2)),
      tierApplied: tier,
      perksApplied
    };
  }

  /**
   * Registers or creates a new gift card.
   */
  public createGiftCard(initialBalance: number, purchasedBy: string): GiftCard {
    const code = `GC-FADE-${Math.floor(1000 + Math.random() * 9000)}`;
    const giftCard: GiftCard = {
      code,
      initialBalance,
      currentBalance: initialBalance,
      currency: 'USD',
      isRedeemed: false,
      purchasedBy
    };
    this.giftCards.set(code, giftCard);
    return giftCard;
  }

  /**
   * Redeems a gift card amount.
   */
  public redeemGiftCard(code: string, amount: number): boolean {
    const gc = this.giftCards.get(code);
    if (!gc || gc.isRedeemed || gc.currentBalance < amount) return false;
    gc.currentBalance -= amount;
    if (gc.currentBalance <= 0) {
      gc.isRedeemed = true;
    }
    return true;
  }

  /**
   * Gets membership plans.
   */
  public getMembershipPlans(): MembershipPlan[] {
    return Array.from(this.membershipPlans.values());
  }

  /**
   * Gets reward catalog items.
   */
  public getRewardCatalog(): RewardItem[] {
    return this.rewardCatalog;
  }
}
