// Канали запису (T-4536, ANL-004): канонічний набір у shared kernel.
// Історичні значення з БД ('web'/'admin'/'mobile'/'walk_in') лишаються
// валідними як аліаси — міграція даних не потрібна, а аналітика й фільтри
// працюють з канонічним набором.
export const BOOKING_SOURCES = [
  'client_web',
  'client_mobile',
  'admin_phone',
  'walk_in',
  'barber_mobile',
  'quick_booking',
  'gbp',
  'external_integration',
  'waitlist_auto',
  'recurring',
] as const;

export type CanonicalBookingSource = (typeof BOOKING_SOURCES)[number];

/** Значення, записані до появи канонічного набору. */
export type LegacyBookingSource = 'web' | 'admin' | 'mobile';

export type BookingSource = CanonicalBookingSource | LegacyBookingSource;

export const LEGACY_SOURCE_ALIASES: Record<LegacyBookingSource, CanonicalBookingSource> = {
  web: 'client_web',
  mobile: 'client_mobile',
  admin: 'admin_phone',
};

/** Канонічне значення для рядка з БД/запиту; null — невідомий канал. */
export function normalizeBookingSource(raw: string): CanonicalBookingSource | null {
  if ((BOOKING_SOURCES as readonly string[]).includes(raw)) return raw as CanonicalBookingSource;
  return LEGACY_SOURCE_ALIASES[raw as LegacyBookingSource] ?? null;
}

export function isKnownBookingSource(raw: string): boolean {
  return normalizeBookingSource(raw) !== null;
}

/**
 * Фільтр адмін-списку за каналом: приймає канонічні значення й історичні
 * аліаси (кома-розділений список) і повертає всі рядки БД, що відповідають
 * цим каналам (канонічне + його аліас).
 */
export function bookingSourceFilter(raw: string): string[] {
  const out = new Set<string>();
  for (const token of raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)) {
    const canonical = normalizeBookingSource(token);
    if (!canonical) continue;
    out.add(canonical);
    for (const [alias, target] of Object.entries(LEGACY_SOURCE_ALIASES)) {
      if (target === canonical) out.add(alias);
    }
  }
  return [...out];
}
