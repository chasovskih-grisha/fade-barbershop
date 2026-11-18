// Push API для мобільного клієнта (T-070/T-4422): реєстрація Expo-токена
// і відкликання. Базується на тому ж fetch, що й client-sessions.ts —
// точну схему авторизації мобільного клієнта визначаємо окремо;
// поки — контрактний шар без реалізованого bearer/cookie.

import { apiBase } from './api-base';
import type { RegisterPushTokenResult, RevokePushTokenResult } from '@fade/contracts';

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Реєструємо Expo-токен на сервері. */
export async function registerPushToken(
  token: string,
  platform?: 'ios' | 'android'
): Promise<void> {
  const result = await fetchJson<RegisterPushTokenResult>('/identity/client/push-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform }),
  });
  // контракт повертає { ok: true } — просто перевіряємо, що запит пройшов
  if (!result.ok) throw new Error('registerPushToken: unexpected response');
}

/** Вимкнення push-каналу для поточного пристрою (вихід, logout). */
export async function revokePushToken(token: string): Promise<void> {
  const result = await fetchJson<RevokePushTokenResult>('/identity/client/push-tokens/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!result.ok) throw new Error('revokePushToken: unexpected response');
}
