import type { AccrualInput, AccrualResult, LoyaltyRule } from './types';
import { calculateTier } from './rules';

interface StreakOutcome {
  bonusPoints: number;
  nextStreak: number;
}

export function accruePoints(input: AccrualInput, rule: LoyaltyRule): AccrualResult {
  const { account, spendCents, isBirthday, isReferral, completedVisit } = input;
  const dollars = spendCents / 100;
  const multiplier = rule.tierMultipliers[account.tier] || 1.0;
  const bonusApplied: string[] = [];

  let pointsEarned = Math.floor(dollars * rule.pointsPerDollar * multiplier);
  if (isBirthday) {
    pointsEarned += rule.birthdayBonusPoints;
    bonusApplied.push('BIRTHDAY_BONUS');
  }
  if (isReferral) {
    pointsEarned += rule.referralBonusPoints;
    bonusApplied.push('REFERRAL_BONUS');
  }

  const streak = resolveStreak(completedVisit, account.consecutiveVisits || 0, rule);
  pointsEarned += streak.bonusPoints;
  if (streak.bonusPoints > 0) bonusApplied.push('STREAK_BONUS');

  const newLifetimePoints = account.lifetimePoints + pointsEarned;
  return {
    pointsEarned,
    newPointsTotal: account.points + pointsEarned,
    newLifetimePoints,
    newTier: calculateTier(newLifetimePoints, rule.tierThresholds),
    bonusApplied,
    newConsecutiveVisits: streak.nextStreak,
  };
}

function resolveStreak(
  completedVisit: boolean | undefined,
  currentStreak: number,
  rule: LoyaltyRule
): StreakOutcome {
  if (!completedVisit) return { bonusPoints: 0, nextStreak: currentStreak };

  const nextStreak = currentStreak + 1;
  if (nextStreak >= rule.streakBonusThreshold) {
    return { bonusPoints: rule.streakBonusPoints, nextStreak: 0 };
  }
  return { bonusPoints: 0, nextStreak };
}
