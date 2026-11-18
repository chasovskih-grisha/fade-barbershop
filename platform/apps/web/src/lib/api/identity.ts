import { apiBase } from './api-base';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  preferences: string[];
  /** День і місяць народження без року (T-4730); порожнє — дефолт. */
  birthday?: { day: number; month: number } | null;
}

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T | null> {
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

export async function requestOtp(phone: string): Promise<{ success: boolean }> {
  const result = await fetchJson<{ success: boolean }>('/identity/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  return result ?? { success: false };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ token: string; user: User }> {
  const result = await fetchJson<{
    token: string;
    refreshToken?: string;
    expiresInSec?: number;
    user: { id: string; phone: string; name?: string; role?: string };
  }>('/identity/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code, channel: 'web' }),
  });
  if (!result) throw new Error('Невірний код або код прострочений.');
  return {
    token: result.token,
    user: {
      id: result.user.id,
      phone: result.user.phone,
      name: result.user.name ?? null,
      role: result.user.role ?? 'client',
      preferences: [],
    },
  };
}

export async function getProfile(token: string): Promise<User> {
  const result = await fetchJson<{
    id: string;
    phone: string;
    name: string | null;
    role: string;
    birthday?: { day: number; month: number } | null;
  }>('/identity/profile', { headers: { Authorization: `Bearer ${token}` } });
  if (!result) throw new Error('Unauthorized');
  return {
    id: result.id,
    phone: result.phone,
    name: result.name,
    role: result.role,
    preferences: [],
    birthday: result.birthday ?? null,
  };
}

export async function updateBirthday(
  token: string,
  birthday: { day: number; month: number } | null
): Promise<User> {
  const result = await fetchJson<User>('/identity/profile/birthday', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ birthday }),
  });
  if (!result) throw new Error('Failed to update birthday');
  return result;
}

export async function updateName(token: string, name: string): Promise<User> {
  const result = await fetchJson<User>('/identity/profile/name', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  if (!result) throw new Error('Failed to update name');
  return result;
}

export async function updatePreferences(token: string, preferences: string[]): Promise<User> {
  const result = await fetchJson<User>('/identity/profile/preferences', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ preferences }),
  });
  if (!result) throw new Error('Failed to update preferences');
  return result;
}
