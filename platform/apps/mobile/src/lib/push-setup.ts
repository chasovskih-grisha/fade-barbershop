import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { EAS_PROJECT_ID, isPushAllowed, pushProjectConfigured } from './push-token';

/**
 * T-070 (reopened): запит дозволу на сповіщення пристрою.
 * - На реальному пристрої показати системний діалог і повернути Expo-токен,
 *   коли дозвіл надано.
 * - Коли дозвіл уже відмовлено — не запитувати його вдруге (система діалог не
 *   покаже) і не імітувати токен: екран отримує помилку й показує стан
 *   «сповіщення вимкнено».
 * - Коли дозвіл ще не визначений — спитати ОС (на Android спершу створити канал).
 */
export async function registerForPushNotificationsAsync(): Promise<string> {
  if (!pushProjectConfigured()) {
    throw new Error('Push notifications: EAS_PROJECT_ID is not configured');
  }

  let status = await Notifications.getPermissionsAsync();

  if (status?.ios?.status === Notifications.IosAuthorizationStatus.DENIED) {
    throw new Error('Push notifications: permission denied');
  }

  if (!isPushAllowed(status)) {
    // На Android краще створити канал до запиту дозволу, щоб повідомлення
    // з'являлися одразу після надання дозволу.
    if (Constants.platform?.android) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Повідомлення',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => undefined);
    }

    status = await Notifications.requestPermissionsAsync();
  }

  if (!isPushAllowed(status)) {
    throw new Error(
      status?.granted === false
        ? 'Push notifications: permission denied'
        : 'Push notifications: permission not granted'
    );
  }

  try {
    const expoToken = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    return typeof expoToken?.data === 'string' ? expoToken.data : '';
  } catch {
    return '';
  }
}
