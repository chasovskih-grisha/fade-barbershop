// Ризик-скор запису (T-172, WTL-001…007): оцінка, за якою черга очікування
// вирішує, кого підвищувати першим.
export interface ScoredBooking {
  bookingId: string;
  clientId: string;
  score: number;
  tier: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

/** Тир ризику: та сама шкала, що й у `ScoredBooking`. */
export type RiskTier = ScoredBooking['tier'];

/** Ознаки, з яких рахується ризик запису (T-172). */
export interface BookingRiskSignals {
  /** Скільки no-show у клієнта за політикою. */
  clientNoShowCount?: number;
  /** Скільки скасувань пізніше ніж за добу. */
  lateCancellations?: number;
  /** Годин до початку візиту; менше — ризикованіше. */
  hoursUntilSlot?: number;
  /** Депозит уже сплачено — ризик нижчий. */
  depositPaid?: boolean;
  /** Клієнт уперше в салоні. */
  firstVisit?: boolean;
}

/** Оцінка ризику запису з поясненням для адмінки. */
export interface BookingRiskAssessment {
  bookingId?: string;
  clientId?: string;
  score: number;
  tier: RiskTier;
  factors: string[];
  signals: BookingRiskSignals;
}

/** Тир за числовим скором: пороги узяті з T-172 (0–100). */
export function riskTierFor(score: number): ScoredBooking['tier'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
