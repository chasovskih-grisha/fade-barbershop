// ETA для черги (T-170a interface, WTL-ADM-01/04).
//
// Оцінка прозора й детермінована: бере історичну частку прийнятих пропозицій
// (promotion rate) і фактичну к-сть звільнених слотів за годину в бакеті
// доби, тоді рахує, скільки таких слотів має пройти до вашої позиції.
// Жодного прихованого «ML-магії»: усі ваги — константи нижче, тож оцінку
// можна пояснити клієнту й адміну й перевірити тестом.

export type TimeBucket = 'morning' | 'afternoon' | 'evening';

/** Історичні дані з аналітики; порожні значення дають дефолти, а не нуль. */
export interface WaitlistEtaHistory {
  /** Скільки слотів звільняється за годину в кожному бакеті доби. */
  slotsFreedPerHour?: Partial<Record<TimeBucket, number>>;
  /** Пропозиції за період: скільки надіслано і скільки прийнято. */
  offersSent?: number;
  offersAccepted?: number;
}

export interface WaitlistEtaInput {
  /** 1 — наступний у черзі. */
  position: number;
  /** Скільки місць шукає клієнт (група займає більше крісел). */
  partySize?: number;
  /** Локальна година початку очікування (0–23). */
  localHour: number;
  history?: WaitlistEtaHistory;
  /** Типова тривалість послуги, хвилини. */
  durationMinutes?: number;
}

export interface WaitlistEta {
  minutes: number;
  bucket: TimeBucket;
  promotionRate: number;
  freedSlotsPerHour: number;
}

export const ETA_DEFAULTS = {
  /** Немає історії — консервативно: третина пропозицій приймається. */
  promotionRate: 0.35,
  freedSlotsPerHour: 1.2,
  durationMinutes: 30,
  /** Межі оцінки: менше 5 хв не обіцяємо, більше 8 год — не лякаємо. */
  minMinutes: 5,
  maxMinutes: 480,
  /** Крок округлення. */
  stepMinutes: 5,
  /** Додатковий час за кожне додаткове місце в групі. */
  partyPenalty: 0.25,
  maxPartyFactor: 2.5,
} as const;

/** Бакет доби за локальною годиною. */
export function timeBucketForLocalHour(hour: number): TimeBucket {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function positive(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

/** Частка прийнятих пропозицій, обмежена [0.05, 0.95]. */
export function promotionRate(history: WaitlistEtaHistory = {}): number {
  const sent = history.offersSent ?? 0;
  const accepted = history.offersAccepted ?? 0;
  if (sent <= 0 || accepted < 0) return ETA_DEFAULTS.promotionRate;
  const rate = accepted / sent;
  return Math.min(0.95, Math.max(0.05, rate));
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Скільки хвилин чекати. Логіка: до вашої позиції має «пропустити» вас
 * `position / promotionRate` звільнень; за годину їх стається
 * `freedSlotsPerHour`; група й довга послуга множать результат.
 */
export function estimateWaitMinutes(input: WaitlistEtaInput): WaitlistEta {
  const bucket = timeBucketForLocalHour(input.localHour);
  const rate = promotionRate(input.history);
  const freedSlotsPerHour = positive(
    input.history?.slotsFreedPerHour?.[bucket],
    ETA_DEFAULTS.freedSlotsPerHour
  );

  const position = Math.max(1, Math.floor(input.position));
  const partySize = Math.max(1, Math.floor(input.partySize ?? 1));
  const duration = positive(input.durationMinutes, ETA_DEFAULTS.durationMinutes);

  const partyFactor = Math.min(
    ETA_DEFAULTS.maxPartyFactor,
    1 + (partySize - 1) * ETA_DEFAULTS.partyPenalty
  );
  const durationFactor = clamp(duration / ETA_DEFAULTS.durationMinutes, 0.5, 3);

  const expectedFreedSlots = position / rate;
  const rawMinutes = (expectedFreedSlots / freedSlotsPerHour) * 60 * partyFactor * durationFactor;
  const bounded = clamp(rawMinutes, ETA_DEFAULTS.minMinutes, ETA_DEFAULTS.maxMinutes);
  const minutes = Math.round(bounded / ETA_DEFAULTS.stepMinutes) * ETA_DEFAULTS.stepMinutes;

  return { minutes, bucket, promotionRate: rate, freedSlotsPerHour };
}
