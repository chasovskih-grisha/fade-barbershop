// Offline-кеш стартових даних (T-4429): чиста логіка TTL і «застарілих» даних,
// без React і без HTTP. Сховище — порт `CacheStorage`; у проді його реалізує
// нативний AsyncStorage/SecureStore, у тестах — пам'ять.

import { decodeEntry, encodeEntry, isFresh, CACHE_TTL_MS } from './cache-entry';

export { CACHE_TTL_MS, isFresh, decodeEntry, encodeEntry } from './cache-entry';
export type { CacheEntry } from './cache-entry';

export interface CacheStorage {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
}

export interface CacheJob<T> {
  storage: CacheStorage;
  key: string;
  fetcher: () => Promise<T>;
  now: number;
  ttl?: number;
}

export type Cached<T> = { data: T; stale: boolean };

export async function readCache<T>(
  job: Pick<CacheJob<T>, 'storage' | 'key' | 'now' | 'ttl'>
): Promise<Cached<T> | null> {
  const entry = decodeEntry<T>(await job.storage.read(job.key));
  if (!entry) return null;
  return { data: entry.data, stale: !isFresh(entry, job.now, job.ttl ?? CACHE_TTL_MS) };
}

export async function writeCache<T>(
  job: Pick<CacheJob<T>, 'storage' | 'key' | 'now'>,
  data: T
): Promise<void> {
  await job.storage.write(job.key, encodeEntry(data, job.now));
}

/** Мережеве оновлення: тягне свіже, кладе в кеш і знімає позначку «застарілі». */
export async function refreshAndStore<T>(job: CacheJob<T>): Promise<Cached<T>> {
  const fresh = await job.fetcher();
  await writeCache(job, fresh);
  return { data: fresh, stale: false };
}

/**
 * Свіже з кешу віддаємо без мережі; інакше — запит і перезапис кешу. Помилка
 * мережі з наявним кешем повертає «застарілі» дані, а не порожній екран.
 */
export async function loadWithCache<T>(job: CacheJob<T>): Promise<Cached<T>> {
  const cached = await readCache<T>(job);
  if (cached && !cached.stale) return cached;
  try {
    return await refreshAndStore(job);
  } catch (error) {
    if (cached) return { data: cached.data, stale: true };
    throw error;
  }
}

const inflight = new Map<string, Promise<unknown>>();

/** Старт не має слати той самий запит двічі (StrictMode, подвійний рендер). */
export function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const pending = run().finally(() => inflight.delete(key));
  inflight.set(key, pending);
  return pending;
}
