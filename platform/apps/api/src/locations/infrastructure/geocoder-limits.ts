// Ліміти й ключ кешу CachedRateLimitedGeocoder (окремо від декоратора — гейт max-lines).
/** Надгробок після 3 збоїв провайдера підряд, на 60 с. */
export const TOMBSTONE_AFTER_FAILURES = 3;
export const TOMBSTONE_MS = 60_000;
/** Верхня межа TTL, яку сховище має поважати (захист від «назавжди»). */
export const CACHE_TTL_MAX_MS = 7 * 24 * 60 * 60 * 1000;
/** Глобальний ключ лімітів/надгробка: бюджет адаптера цілком, не координати. */
export const GLOBAL_LIMIT_KEY = 'global';

/** Ключ кешу: 3 знаки ≈ 110 м — одна точка міста; кеш не розпадається на
 * мілісекундні варіації GPS-неточності. */
export function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)}|${lng.toFixed(3)}`;
}
