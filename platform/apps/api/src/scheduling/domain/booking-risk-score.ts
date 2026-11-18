// Ризик-скор запису (T-172, WTL-001…007): оцінка, за якою черга очікування
// вирішує, кого підвищувати першим.
export interface ScoredBooking {
  bookingId: string;
  clientId: string;
  score: number;
  tier: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

/** Тир за числовим скором: пороги узяті з T-172 (0–100). */
export function riskTierFor(score: number): ScoredBooking['tier'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
