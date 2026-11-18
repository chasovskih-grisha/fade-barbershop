import { ClientOnboardingEngine } from './domain/client-onboarding-engine.entity';

describe('ClientOnboardingEngine', () => {
  it('should trigger Day 0 welcome for new unregistered/first-time booking', () => {
    const action = ClientOnboardingEngine.evaluateNextAction({
      daysSinceFirstVisit: 0,
      hasCompletedFirstVisit: false,
      hasUpcomingBooking: false,
      profileCompleted: false,
      totalVisits: 0,
    });

    expect(action).not.toBeNull();
    expect(action?.step).toBe('DAY_0_WELCOME');
    expect(action?.promoCode).toBeUndefined();
  });

  it('should trigger Day 3 maintenance tip with product discount', () => {
    const action = ClientOnboardingEngine.evaluateNextAction({
      daysSinceFirstVisit: 3,
      hasCompletedFirstVisit: true,
      hasUpcomingBooking: false,
      profileCompleted: true,
      totalVisits: 1,
    });

    expect(action).not.toBeNull();
    expect(action?.step).toBe('DAY_3_MAINTENANCE');
    expect(action?.incentiveDiscountPercentage).toBe(10);
    expect(action?.promoCode).toBe('FADE-FRESH-10');
  });

  it('should trigger Day 7 rebooking incentive when no upcoming booking exists', () => {
    const action = ClientOnboardingEngine.evaluateNextAction({
      daysSinceFirstVisit: 7,
      hasCompletedFirstVisit: true,
      hasUpcomingBooking: false,
      profileCompleted: true,
      totalVisits: 1,
    });

    expect(action).not.toBeNull();
    expect(action?.step).toBe('DAY_7_REBOOKING_INCENTIVE');
    expect(action?.incentiveDiscountPercentage).toBe(20);
    expect(action?.promoCode).toBe('FADE-REBOOK-20');
  });

  it('should trigger referral fast start after first completed visit', () => {
    const action = ClientOnboardingEngine.evaluateNextAction({
      daysSinceFirstVisit: 1,
      hasCompletedFirstVisit: true,
      hasUpcomingBooking: true,
      profileCompleted: true,
      totalVisits: 1,
    });

    expect(action).not.toBeNull();
    expect(action?.step).toBe('REFERRAL_FAST_START');
    expect(action?.bonusLoyaltyPoints).toBe(300);
  });

  it('should return full onboarding timeline', () => {
    const timeline = ClientOnboardingEngine.getFullOnboardingTimeline();
    expect(timeline).toHaveLength(4);
    expect(timeline[0]?.step).toBe('DAY_0_WELCOME');
    expect(timeline[3]?.step).toBe('REFERRAL_FAST_START');
  });
});
