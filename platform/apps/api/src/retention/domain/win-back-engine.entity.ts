export type DormancyTier = 'RECENT_LAPSE' | 'DORMANT' | 'CHURNED';

export interface WinBackRule {
  dormancyTier: DormancyTier;
  minInactiveDays: number;
  maxInactiveDays: number;
  reactivationDiscountPercentage: number;
  complimentaryPerk?: string;
  recommendedChannel: 'SMS' | 'PUSH' | 'WHATSAPP';
}

export const WIN_BACK_RULES: Record<DormancyTier, WinBackRule> = {
  RECENT_LAPSE: {
    dormancyTier: 'RECENT_LAPSE',
    minInactiveDays: 30,
    maxInactiveDays: 59,
    reactivationDiscountPercentage: 15,
    recommendedChannel: 'SMS',
  },
  DORMANT: {
    dormancyTier: 'DORMANT',
    minInactiveDays: 60,
    maxInactiveDays: 89,
    reactivationDiscountPercentage: 20,
    complimentaryPerk: 'Complimentary Styling Product',
    recommendedChannel: 'PUSH',
  },
  CHURNED: {
    dormancyTier: 'CHURNED',
    minInactiveDays: 90,
    maxInactiveDays: 365,
    reactivationDiscountPercentage: 25,
    complimentaryPerk: 'Free Haircut Upgrade / Hot Towel Shave',
    recommendedChannel: 'WHATSAPP',
  },
};

export class WinBackEngine {
  static evaluateDormancy(inactiveDays: number): WinBackRule {
    if (inactiveDays >= 90) {
      return WIN_BACK_RULES.CHURNED;
    }
    if (inactiveDays >= 60) {
      return WIN_BACK_RULES.DORMANT;
    }
    return WIN_BACK_RULES.RECENT_LAPSE;
  }

  static generateMessage(
    clientName: string,
    inactiveDays: number
  ): { rule: WinBackRule; message: string } {
    const rule = this.evaluateDormancy(inactiveDays);
    const perkText = rule.complimentaryPerk ? ` plus a ${rule.complimentaryPerk}` : '';
    const message = `Hey ${clientName}, we miss you at FADE! It's been ${inactiveDays} days since your last fresh cut. Book your next visit within 7 days and enjoy ${rule.reactivationDiscountPercentage}% off${perkText}. See you in the chair!`;
    return { rule, message };
  }
}
