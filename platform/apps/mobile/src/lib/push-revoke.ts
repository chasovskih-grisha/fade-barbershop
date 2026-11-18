import * as Notifications from 'expo-notifications';
import { revokePushToken } from './api/push';

/** Знімає токен на сервері і локально. false — токена не було. */
export async function revokeStoredPush(token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    await revokePushToken(token);
  } catch {
    // Сервер може не відповісти — локально push все одно вимикаємо.
  }
  Notifications.dismissAllNotificationsAsync().catch(() => undefined);
  return true;
}
