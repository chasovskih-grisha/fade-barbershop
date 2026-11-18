import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from './api/push';
import { revokeStoredPush } from './push-revoke';
import { EAS_PROJECT_ID, isPushAllowed, pushProjectConfigured } from './push-token';

export { getExpoPushToken } from './push-token';

export interface UsePushResult {
  token: string | null;
  permission: Notifications.NotificationPermissionsStatus | null;
  allowed: boolean;
  register: () => Promise<void>;
  revoke: () => Promise<void>;
  error: string | null;
}

/**
 * Підписує пристрій на Expo push-сповіщення і зберігає токен на сервері.
 * Спочатку перевіряє поточний статус дозволу і при наявності токена
 * одразу реєструє його. Після цього слухає зміни токена, щоб підтримувати
 * сервер в актуальному стані. Якщо потрібно запросити дозвіл —
 * викликати `register()` з UI.
 *
 * Плейсхолдерні токени у дев-середовищі: у Expo Go 50 SDK push-токени
 * підтримуються, але якщо projectId не вказано, getExpoPushTokenAsync
 * повертає плейсхолдер. Тому при збиранні нативного пристрою/token
 * слід налаштувати EAS_PROJECT_ID у app.config.*.
 */
export function usePush(): UsePushResult {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<Notifications.NotificationPermissionsStatus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const permissionRef = useRef<Notifications.NotificationPermissionsStatus | null>(null);

  const registerExpoToken = useCallback(async () => {
    if (!pushProjectConfigured()) return;
    const expoToken = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    setToken(expoToken.data);
    await registerPushToken(expoToken.data);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!pushProjectConfigured()) {
      throw new Error('Push notifications: EAS_PROJECT_ID is not configured');
    }

    try {
      // На Android перед запитом дозвілу краще створити канал — негайно після
      // requestPermissionsAsync notification у деяких версіях не показується.
      if (Constants.platform?.android) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Повідомлення',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      let status = await Notifications.getPermissionsAsync();
      setPermission(status);
      permissionRef.current = status;

      if (!isPushAllowed(status)) {
        status = await Notifications.requestPermissionsAsync();
        setPermission(status);
        permissionRef.current = status;
      }

      if (isPushAllowed(status)) {
        await registerExpoToken();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невдалося запросити дозвіл на сповіщення');
      throw err;
    }
  }, [registerExpoToken]);

  useEffect(() => {
    // Готуємо підписку на зміну нативного токена перед запитом дозволу —
    // це гарантує, що кожна нова версія токена буде відправлена на сервер.
    const subscription = Notifications.addPushTokenListener(async ({ data }) => {
      if (!pushProjectConfigured()) return;
      // Даний слухач повертає нативний FCM/APNs токен. Для Expo-сервісу
      // необхідно отримати Expo-токен через getExpoPushTokenAsync.
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync({
          projectId: EAS_PROJECT_ID,
          devicePushToken: data,
        });
        setToken(expoToken.data);
        await registerPushToken(expoToken.data);
      } catch {
        // Offline or transient — не ламати UI, помилимося тихо.
      }
    });

    (async () => {
      try {
        const status = await Notifications.getPermissionsAsync();
        setPermission(status);
        permissionRef.current = status;

        if (isPushAllowed(status) && pushProjectConfigured()) {
          await registerExpoToken();
        }
      } catch {
        // При першому запуску дозвіл може бути невідомим — залишаємо null.
      }
    })();

    return () => subscription.remove();
  }, [registerExpoToken]);

  const revoke = useCallback(async () => {
    if (await revokeStoredPush(token)) setToken(null);
  }, [token]);

  return {
    token,
    permission,
    allowed: isPushAllowed(permission),
    register: requestPermission,
    revoke,
    error,
  };
}
