import { apiBase } from './api-base';
import type { User } from './identity';

interface UpdateProfileFieldInput {
  token: string;
  path: string;
  body: unknown;
  errorMessage: string;
}

/** Shared PATCH for profile fields; 404 means the profile is unavailable. */
export async function updateProfileField({
  token,
  path,
  body,
  errorMessage,
}: UpdateProfileFieldInput): Promise<User> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (res.status === 404) throw new Error(errorMessage);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `API ${res.status}` }));
    throw new Error(err.message || `API ${res.status}`);
  }
  return (await res.json()) as User;
}
