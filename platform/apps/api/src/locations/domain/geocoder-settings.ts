// Порти й політика геокодування (домен): провайдер геокодування —
// адмін-налаштування (MNG-ADM-18, «зміна інтеграцій не потребує деплою»).

export type GeocoderProvider = 'nominatim' | 'google';

export interface GeocoderSettings {
  /** Провайдер зворотного геокодування; за замовчуванням — nominatim. */
  readonly provider: GeocoderProvider;
  /** Ліміт зовнішніх дзвінків за вікно (політика Nominatim ≤1 req/s). */
  readonly rateLimit: { readonly max: number; readonly windowMs: number };
  /** TTL кешу відповідей провайдера. */
  readonly cacheTtlMs: number;
}

export const DEFAULT_GEOCODER_SETTINGS: GeocoderSettings = {
  provider: 'nominatim',
  rateLimit: { max: 1, windowMs: 1000 },
  cacheTtlMs: 24 * 60 * 60 * 1000,
};

export const SETTING_KEY = 'locations.geocoder';

/** Валідує форму значення налаштування (з JSON AppSetting). */
export function parseGeocoderSettings(raw: unknown): GeocoderSettings {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    provider?: unknown;
    rateLimit?: { max?: unknown; windowMs?: unknown };
    cacheTtlMs?: unknown;
  };
  return {
    provider: input.provider === 'google' ? 'google' : 'nominatim',
    rateLimit: {
      max: sanitizeNumber(input.rateLimit?.max, 1, DEFAULT_GEOCODER_SETTINGS.rateLimit.max),
      windowMs: sanitizeNumber(
        input.rateLimit?.windowMs,
        100,
        DEFAULT_GEOCODER_SETTINGS.rateLimit.windowMs
      ),
    },
    cacheTtlMs: sanitizeNumber(input.cacheTtlMs, 0, DEFAULT_GEOCODER_SETTINGS.cacheTtlMs),
  };
}

/** Числове налаштування: число ≥ floor (ціле) — інакше fallback. */
function sanitizeNumber(input: unknown, floor: number, fallback: number): number {
  if (typeof input !== 'number' || !Number.isFinite(input) || input < floor) return fallback;
  return Math.floor(input);
}

/** Порт читання налаштування геокодування. */
export interface GeocoderSettingsPort {
  get(): Promise<GeocoderSettings>;
}
