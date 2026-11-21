import type { RetentionStreakRequest, RetentionStreakResult } from './types';

interface StreakBenefits {
  multiplier: number;
  perks: string[];
  credits: number;
}

function resolveStreakBenefits(visits: number): StreakBenefits {
  if (visits >= 6) {
    return {
      multiplier: 1.35,
      perks: [
        'Free Beard Trim upgrade',
        'Priority Saturday slot access',
        'Dedicated VIP Barber preference',
      ],
      credits: 50,
    };
  }
  if (visits >= 3) {
    return {
      multiplier: 1.2,
      perks: ['Complimentary beverage', '5-minute early seating'],
      credits: 25,
    };
  }
  return { multiplier: 1.0, perks: [], credits: 10 };
}

/**
 * Calculate client retention streak multiplier and perks for loyal recurring bookings.
 */
export function calculateRetentionStreak(request: RetentionStreakRequest): RetentionStreakResult {
  const benefits = resolveStreakBenefits(request.consecutiveOnTimeVisits);
  const unlockedPerks = ['Standard booking priority', ...benefits.perks];
  let multiplier = benefits.multiplier;
  let credits = benefits.credits;

  if (request.currentTier === 'vip') {
    multiplier += 0.15;
    unlockedPerks.push('VIP Concierge Access');
    credits += 25;
  }

  return {
    clientId: request.clientId,
    streakBonusMultiplier: Number(multiplier.toFixed(2)),
    unlockedPerks,
    loyaltyMultiplierCredits: credits,
  };
}
