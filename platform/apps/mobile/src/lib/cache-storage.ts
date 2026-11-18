// Сховище кешу (T-4429): порт `CacheStorage` і дві реалізації без нових
// залежностей. `memoryStorage` — для тестів і як безпечний фолбек; `deviceStorage`
// використовує `localStorage`, коли він є (web / RN-Web), інакше — пам'ять.

import type { CacheStorage } from './offline-cache';

export function memoryStorage(): CacheStorage {
  const map = new Map<string, string>();
  return {
    async read(key) {
      return map.get(key) ?? null;
    },
    async write(key, value) {
      map.set(key, value);
    },
  };
}

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function webStorage(): WebStorage | null {
  const candidate = (globalThis as { localStorage?: WebStorage }).localStorage;
  return candidate && typeof candidate.getItem === 'function' ? candidate : null;
}

export function deviceStorage(): CacheStorage {
  const web = webStorage();
  if (web) {
    return {
      async read(key) {
        return web.getItem(key);
      },
      async write(key, value) {
        web.setItem(key, value);
      },
    };
  }
  return memoryStorage();
}
