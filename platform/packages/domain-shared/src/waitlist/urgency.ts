/**
 * Apply recency and VIP bonuses to a waitlist priority score.
 */
export function calculateWaitlistUrgencyBonus(
  basePriorityScore: number,
  hoursUntilSlot: number,
  isVip: boolean = false
): number {
  let bonus = 0;
  if (hoursUntilSlot <= 6) {
    bonus += 50;
  } else if (hoursUntilSlot <= 24) {
    bonus += 20;
  }
  if (isVip) {
    bonus += 30;
  }
  return basePriorityScore + bonus;
}
