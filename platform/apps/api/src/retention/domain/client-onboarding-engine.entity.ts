export type OnboardingStepType = 
  | 'DAY_0_WELCOME' 
  | 'DAY_3_MAINTENANCE' 
  | 'DAY_7_REBOOKING_INCENTIVE' 
  | 'REFERRAL_FAST_START';

export interface OnboardingStepAction {
  step: OnboardingStepType;
  title: string;
  message: string;
  incentiveDiscountPercentage?: number;
  bonusLoyaltyPoints?: number;
  promoCode?: string;
  actionUrl: string;
}

export interface ClientOnboardingContext {
  daysSinceFirstVisit: number;
  hasCompletedFirstVisit: boolean;
  hasUpcomingBooking: boolean;
  profileCompleted: boolean;
  totalVisits: number;
}

export class ClientOnboardingEngine {
  static evaluateNextAction(context: ClientOnboardingContext): OnboardingStepAction | null {
    if (!context.hasCompletedFirstVisit && context.daysSinceFirstVisit === 0) {
      return {
        step: 'DAY_0_WELCOME',
        title: 'Welcome to FADE! 💈',
        message: 'Your chair is reserved. Meet your master barber, review our style guide, and get ready for a premier grooming experience.',
        actionUrl: '/app/welcome',
      };
    }

    if (context.hasCompletedFirstVisit && context.daysSinceFirstVisit === 3) {
      return {
        step: 'DAY_3_MAINTENANCE',
        title: 'Keep Your Cut Fresh ✂️',
        message: 'How is the new look? Here are 3 daily maintenance tips for your hair/beard type, plus 10% off any grooming wax or beard oil.',
        incentiveDiscountPercentage: 10,
        promoCode: 'FADE-FRESH-10',
        actionUrl: '/app/shop/grooming-products',
      };
    }

    if (context.hasCompletedFirstVisit && !context.hasUpcomingBooking && context.daysSinceFirstVisit >= 7) {
      return {
        step: 'DAY_7_REBOOKING_INCENTIVE',
        title: 'Time for a Cleanup? ⚡',
        message: 'Most clients keep their sharp look with a 2-3 week cadence. Book your next visit within 48 hours and enjoy 20% off.',
        incentiveDiscountPercentage: 20,
        bonusLoyaltyPoints: 150,
        promoCode: 'FADE-REBOOK-20',
        actionUrl: '/app/booking/select-service',
      };
    }

    if (context.hasCompletedFirstVisit && context.totalVisits === 1 && context.daysSinceFirstVisit >= 1) {
      return {
        step: 'REFERRAL_FAST_START',
        title: 'Give $15, Get $15 🤝',
        message: 'Loved your FADE experience? Share your personal invite link with friends. They get $15 off their first cut, and you earn $15 credit.',
        bonusLoyaltyPoints: 300,
        actionUrl: '/app/referrals',
      };
    }

    return null;
  }

  static getFullOnboardingTimeline(): OnboardingStepAction[] {
    return [
      {
        step: 'DAY_0_WELCOME',
        title: 'Welcome to FADE! 💈',
        message: 'Your chair is reserved. Meet your master barber, review our style guide, and get ready for a premier grooming experience.',
        actionUrl: '/app/welcome',
      },
      {
        step: 'DAY_3_MAINTENANCE',
        title: 'Keep Your Cut Fresh ✂️',
        message: 'How is the new look? Here are 3 daily maintenance tips for your hair/beard type, plus 10% off any grooming wax or beard oil.',
        incentiveDiscountPercentage: 10,
        promoCode: 'FADE-FRESH-10',
        actionUrl: '/app/shop/grooming-products',
      },
      {
        step: 'DAY_7_REBOOKING_INCENTIVE',
        title: 'Time for a Cleanup? ⚡',
        message: 'Most clients keep their sharp look with a 2-3 week cadence. Book your next visit within 48 hours and enjoy 20% off.',
        incentiveDiscountPercentage: 20,
        bonusLoyaltyPoints: 150,
        promoCode: 'FADE-REBOOK-20',
        actionUrl: '/app/booking/select-service',
      },
      {
        step: 'REFERRAL_FAST_START',
        title: 'Give $15, Get $15 🤝',
        message: 'Loved your FADE experience? Share your personal invite link with friends. They get $15 off their first cut, and you earn $15 credit.',
        bonusLoyaltyPoints: 300,
        actionUrl: '/app/referrals',
      },
    ];
  }
}
