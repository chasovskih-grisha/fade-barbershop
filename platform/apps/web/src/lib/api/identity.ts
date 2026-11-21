import { fetchJson } from './identity-fetch';
import { updateProfileField } from './identity-profile-update';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  preferences: string[];
  /** День і місяць народження без року (T-4730); порожнє — дефолт. */
  birthday?: { day: number; month: number } | null;
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

export function updateBirthday(
  token: string,
  birthday: { day: number; month: number } | null
): Promise<User> {
  return updateProfileField({
    token,
    path: '/identity/profile/birthday',
    body: { birthday },
    errorMessage: 'Failed to update birthday',
  });
}

export function updateName(token: string, name: string): Promise<User> {
  return updateProfileField({
    token,
    path: '/identity/profile/name',
    body: { name },
    errorMessage: 'Failed to update name',
  });
}

export function updatePreferences(token: string, preferences: string[]): Promise<User> {
  return updateProfileField({
    token,
    path: '/identity/profile/preferences',
    body: { preferences },
    errorMessage: 'Failed to update preferences',
  });
}
