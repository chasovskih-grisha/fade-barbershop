// Booking risk scoring (T-4623): автоматична оцінка ризику онлайн-запису.
// Домен чистий — без Nest/Prisma/HTTP. Бал будується з сигналів запиту
// (географія, пристрій, email, швидкість, ознаки автоматизації); високий бал
// зобовʼязує депозит, перекриваючи стандартну політику «оплата на місці».

export interface BookingRiskSignals {
  ipCountryCode: string;
  phoneCountryCode: string;
  /** Ентропія відпечатка пристрою [0,1]; низька — ознака скрипта. */
  deviceFingerprintEntropy: number;
  /** Вік домену email у днях; відсутній — визначити не вдалося. */
  emailDomainAgeDays?: number | undefined;
  bookingsLast24h: number;
  distinctPhonesPerDevice: number;
  isVpnOrProxy: boolean;
  isDatacenterIp: boolean;
}

export type RiskTier = 'low' | 'elevated' | 'high';

export interface BookingRiskAssessment {
  /** Бал ризику 0..100. */
  score: number;
  tier: RiskTier;
  /** Високий ризик зобовʼязує депозит замість оплати на місці. */
  requiresDepositHold: boolean;
  /** Частка передоплати, % (0 — депозит не потрібен). */
  depositPercent: number;
  factors: string[];
}

export interface RiskScoringConfig {
  highRiskThreshold: number;
  elevatedThreshold: number;
  depositPercent: number;
}

export const DEFAULT_RISK_CONFIG: RiskScoringConfig = {
  highRiskThreshold: 65,
  elevatedThreshold: 40,
  depositPercent: 50,
};

/** Правило оцінки: ярлик, вага в балах і умова спрацювання. */
interface RiskRule {
  label: string;
  points: number;
  matches: (s: BookingRiskSignals) => boolean;
}

const sameCountry = (a: string, b: string): boolean => a.toUpperCase() === b.toUpperCase();

const RISK_RULES: RiskRule[] = [
  {
    label: 'ip-phone-country-mismatch',
    points: 25,
    matches: ({ ipCountryCode: ip, phoneCountryCode: ph }) =>
      Boolean(ip && ph) && !sameCountry(ip, ph),
  },
  {
    label: 'low-device-entropy',
    points: 15,
    matches: ({ deviceFingerprintEntropy: e }) => e < 0.3,
  },
  {
    label: 'new-email-domain',
    points: 10,
    matches: ({ emailDomainAgeDays: age }) => age !== undefined && age < 30,
  },
  { label: 'booking-velocity-high', points: 20, matches: ({ bookingsLast24h: n }) => n > 5 },
  {
    label: 'booking-velocity-elevated',
    points: 10,
    matches: ({ bookingsLast24h: n }) => n > 2 && n <= 5,
  },
  {
    label: 'many-phones-per-device',
    points: 15,
    matches: ({ distinctPhonesPerDevice: n }) => n > 3,
  },
  { label: 'vpn-or-proxy', points: 15, matches: ({ isVpnOrProxy }) => isVpnOrProxy },
  { label: 'datacenter-ip', points: 10, matches: ({ isDatacenterIp }) => isDatacenterIp },
];

/** Оцінка ризику запису: бал 0..100, рівень і рішення про депозит. */
export function assessBookingRisk(
  signals: BookingRiskSignals,
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): BookingRiskAssessment {
  const rules = RISK_RULES.filter((rule) => rule.matches(signals));
  const score = Math.min(
    100,
    rules.reduce((sum, r) => sum + r.points, 0)
  );
  const tier: RiskTier =
    score > config.highRiskThreshold
      ? 'high'
      : score >= config.elevatedThreshold
        ? 'elevated'
        : 'low';
  const requiresDepositHold = tier === 'high';
  return {
    score,
    tier,
    requiresDepositHold,
    depositPercent: requiresDepositHold ? config.depositPercent : 0,
    factors: rules.map((r) => r.label),
  };
}

export interface ScoredBooking {
  bookingId: string;
  score: number;
}

/** Черга перевірки адміном: найризикованіші записи першими. */
export function buildReviewQueue(
  bookings: ScoredBooking[],
  threshold: number = DEFAULT_RISK_CONFIG.highRiskThreshold
): ScoredBooking[] {
  return bookings.filter((b) => b.score > threshold).sort((a, b) => b.score - a.score);
}
