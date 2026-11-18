import { apiBase } from './api-base';

export interface Birthday {
  day: number;
  month: number;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  /** День і місяць народження без року (T-4730); порожнє — дефолт. */
  birthday: Birthday | null;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${apiBase()}/identity/profile`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to get profile');
  return (await res.json()) as UserProfile;
}

export async function updateProfileName(name: string): Promise<UserProfile> {
  const res = await fetch(`${apiBase()}/identity/profile/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update name');
  return (await res.json()) as UserProfile;
}

/** День і місяць народження без року (T-4730); `null` очищає збережене. */
export async function updateProfileBirthday(birthday: Birthday | null): Promise<Birthday | null> {
  const res = await fetch(`${apiBase()}/identity/profile/birthday`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ birthday }),
  });
  if (!res.ok) throw new Error('Failed to update birthday');
  const body = (await res.json()) as { birthday?: Birthday | null };
  return body.birthday ?? null;
}

export async function requestOtp(phone: string): Promise<void> {
  const res = await fetch(`${apiBase()}/identity/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, purpose: 'login' }),
  });
  if (!res.ok) throw new Error('Failed to request OTP');
}

export async function verifyOtp(
  phone: string,
  code: string,
  channel: string = 'mobile'
): Promise<{ accessToken: string; refreshToken?: string }> {
  const res = await fetch(`${apiBase()}/identity/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, channel }),
  });
  if (!res.ok) throw new Error('Failed to verify OTP');
  const body = (await res.json()) as { token?: string; refreshToken?: string };
  const result: { accessToken: string; refreshToken?: string } = { accessToken: body.token ?? '' };
  if (body.refreshToken) result.refreshToken = body.refreshToken;
  return result;
}

/** T-4426: обмін збереженого refresh-токена на нову пару (біометричний вхід). */
export async function refreshSession(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${apiBase()}/identity/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Failed to refresh session');
  const body = (await res.json()) as { token?: string; refreshToken?: string };
  return { accessToken: body.token ?? '', refreshToken: body.refreshToken ?? refreshToken };
}
