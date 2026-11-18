// Клієнт пристроїв клієнта (T-4422) — мобільний аналог web-шарру.
// На відміну від Next.js-шарру, тут аналогія credentials::include
// реалізується через передачу refresh-токена/токена сесії, якщо він є.
// Точну схему автентифікації мобільного клієнта визначаємо окремо — поки
// використовуємо той самий /identity/client/* ендпоінт, що й web.

import { apiBase } from './api-base';
import type {
  ClientSession,
  ListClientSessionsResult,
  RevokeAllSessionsResult,
} from '@fade/contracts';

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      // Якщо контекст автентифікації мобільного додатка надасть токен —
      // тоді авторизуємо запит так само, як web через cookie.
      // Зараз — зварюємо контракт, доки real auth hook не запроваджений.
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Активні пристрої клієнта; поточна сесія позначена current: true. */
export async function getClientSessions(): Promise<ClientSession[]> {
  const result = await fetchJson<ListClientSessionsResult>('/identity/client/sessions');
  return result.sessions;
}

/** «Вийти скрізь»: закриває всі інші сесії, повертає кількість закритих. */
export async function revokeAllSessions(): Promise<number> {
  const result = await fetchJson<RevokeAllSessionsResult>('/identity/client/sessions/revoke-all', {
    method: 'POST',
  });
  return result.revokedCount;
}
