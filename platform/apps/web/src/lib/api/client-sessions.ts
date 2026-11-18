import { apiBase } from './api-base';
import type {
  ClientSession,
  ListClientSessionsResult,
  RevokeAllSessionsResult,
} from '@fade/contracts';

// Клієнт пристроїв клієнта (T-4422). У браузері виклик іде через next-rewrite
// /identity/* на API; сесію несе cookie fadoidx (credentials: include).

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { credentials: 'include', ...init });
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
