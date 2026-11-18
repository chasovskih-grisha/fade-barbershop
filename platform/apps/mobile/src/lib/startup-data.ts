// Стартові дані застосунку з offline-кешем (T-4429): локації, послуги і графік.
// Тонкий шар над `loadWithCache` — ключі тут, політика TTL живе в `offline-cache.ts`.
import { loadWithCache, type CacheStorage, type Cached } from './offline-cache';

export type StartupKey = 'locations' | 'services' | 'schedule';

export const STARTUP_KEYS: StartupKey[] = ['locations', 'services', 'schedule'];

export interface StartupDeps {
  storage: CacheStorage;
  now: number;
}

const KEY_PREFIX = 'fade.startup.';

export function startupKey(key: StartupKey): string {
  return `${KEY_PREFIX}${key}`;
}

/**
 * Завантажує одну секцію старту: свіже з кешу, інакше мережа, при помилці —
 * «застарілий» кеш (ризик T-4429: показ, а не приховування).
 */
export function loadStartupSection<T>(
  deps: StartupDeps,
  key: StartupKey,
  fetcher: () => Promise<T>
): Promise<Cached<T>> {
  return loadWithCache<T>({ storage: deps.storage, key: startupKey(key), fetcher, now: deps.now });
}
