export type MilestoneType = 'VISIT_COUNT' | 'YEARLY_ANNIVERSARY' | 'BIRTHDAY';

export interface MilestoneRule {
  type: MilestoneType;
  threshold: number; // e.g. 5th visit, 1 year, or birthday (0 days until birthday / birthday month)
  rewardDiscountPercentage: number;
  bonusLoyaltyPoints: number;
  exclusivePerk?: string;
  celebrationMessageTemplate: string;
}

export class ClientMilestoneEngine {
  static evaluateVisitMilestone(visitCount: number): MilestoneRule | null {
    if (visitCount === 50) {
      return {
        type: 'VISIT_COUNT',
        threshold: 50,
        rewardDiscountPercentage: 35,
        bonusLoyaltyPoints: 2000,
        exclusivePerk: 'Legendary FADE Gold Card & Free Premium Grooming Kit',
        celebrationMessageTemplate: 'Incredible milestone! 50 visits with FADE. Enjoy 35% off, 2,000 bonus points, and our exclusive Gold Card grooming kit.',
      };
    }
    if (visitCount === 25) {
      return {
        type: 'VISIT_COUNT',
        threshold: 25,
        rewardDiscountPercentage: 25,
        bonusLoyaltyPoints: 1000,
        exclusivePerk: 'Complimentary Luxury Shave & Styling Paste',
        celebrationMessageTemplate: 'Quarter-century of fresh cuts! 25 visits milestone unlocked: 25% off and a free luxury shave.',
      };
    }
    if (visitCount === 10) {
      return {
        type: 'VISIT_COUNT',
        threshold: 10,
        rewardDiscountPercentage: 20,
        bonusLoyaltyPoints: 500,
        exclusivePerk: 'Free Beard Trim or Hair Wash Upgrade',
        celebrationMessageTemplate: 'Double digits! 10 visits with FADE. Enjoy 20% off your next visit and 500 loyalty points.',
      };
    }
    if (visitCount === 5) {
      return {
        type: 'VISIT_COUNT',
        threshold: 5,
        rewardDiscountPercentage: 15,
        bonusLoyaltyPoints: 250,
        exclusivePerk: 'Complimentary Beverage & Scalp Massage',
        celebrationMessageTemplate: 'High five! You have completed 5 visits at FADE. Here is 15% off and 250 bonus points.',
      };
    }
    return null;
  }

  static evaluateAnniversaryMilestone(yearsAsClient: number): MilestoneRule | null {
    if (yearsAsClient <= 0) return null;
    return {
      type: 'YEARLY_ANNIVERSARY',
      threshold: yearsAsClient,
      rewardDiscountPercentage: Math.min(10 + yearsAsClient * 5, 30),
      bonusLoyaltyPoints: yearsAsClient * 300,
      exclusivePerk: `Year ${yearsAsClient} FADE Anniversary VIP Treatment`,
      celebrationMessageTemplate: `Happy FADE Anniversary! Celebrating ${yearsAsClient} year(s) of looking sharp together. Enjoy your anniversary perk!`,
    };
  }

  static evaluateBirthday(): MilestoneRule {
    return {
      type: 'BIRTHDAY',
      threshold: 0,
      rewardDiscountPercentage: 30,
      bonusLoyaltyPoints: 1000,
      exclusivePerk: 'Birthday Special Cut & Hot Towel Experience',
      celebrationMessageTemplate: 'Happy Birthday from the FADE team! Celebrate your special day with 30% off any service and 1,000 bonus points.',
    };
  }
}
