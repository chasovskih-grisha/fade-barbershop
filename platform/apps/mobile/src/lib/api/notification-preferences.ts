import { apiBase } from './api-base';
import { getProfile } from './identity';
import {
  fromApiPreferences,
  toApiPreferences,
  type ApiNotificationPreferences,
  type NotificationPreferences,
} from '../notification-preferences';

async function readJson(res: Response): Promise<ApiNotificationPreferences> {
  return (await res.json().catch(() => ({}))) as ApiNotificationPreferences;
}

// Клієнтський id не змінюється в межах сесії — читаємо профіль один раз.
let clientId: string | null = null;

async function preferencesPath(): Promise<string> {
  if (!clientId) clientId = (await getProfile()).id;
  return `${apiBase()}/client/notifications/preferences/${clientId}`;
}

/** Ті самі значення, що показує кабінет на сайті (T-4722b). */
export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await fetch(await preferencesPath(), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load notifications');
  return fromApiPreferences(await readJson(res));
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  const res = await fetch(await preferencesPath(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(toApiPreferences(preferences)),
  });
  if (!res.ok) throw new Error('Failed to save notifications');
  return fromApiPreferences(await readJson(res));
}
