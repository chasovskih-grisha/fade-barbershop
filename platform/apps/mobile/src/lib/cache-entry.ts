// Серіалізація запису кешу (T-4429): TTL-мітка `storedAt` і безпечний розбір.

export interface CacheEntry<T> {
  data: T;
  storedAt: number;
}

/** Свіжість даних: після TTL кеш прирівнюється до офлайну (показ «застарілі»). */
export const CACHE_TTL_MS = 5 * 60 * 1000;

export function isFresh(entry: CacheEntry<unknown>, now: number, ttl = CACHE_TTL_MS): boolean {
  return now - entry.storedAt < ttl;
}

export function encodeEntry<T>(data: T, now: number): string {
  return JSON.stringify({ data, storedAt: now });
}

export function decodeEntry<T>(raw: string | null): CacheEntry<T> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (typeof parsed?.storedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}
