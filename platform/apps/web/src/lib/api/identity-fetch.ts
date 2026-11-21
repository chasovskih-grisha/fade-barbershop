import { apiBase } from './api-base';

/** Authenticated JSON request; 404 maps to null, other failures throw. */
export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: { 'content-type': 'application/json', ...options.headers },
      credentials: 'include',
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'API error' }));
      throw new Error(err.message || `API ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Network error');
  }
}
